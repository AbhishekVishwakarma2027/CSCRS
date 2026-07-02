"""Benchmark and validate the CSCRS production training environment.

This script inspects the latest experiment under ``runs/production_engine/``,
loads the active production configuration, compares selected training settings,
and writes a JSON report without mutating any training code or experiment
artifacts.
"""

from __future__ import annotations

import ast
import csv
import importlib.util
import math
import json
import logging
import statistics
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from typing import Any


LOGGER = logging.getLogger("cscrs.benchmark")


@dataclass(slots=True)
class CheckResult:
	"""Represents a single configuration comparison result."""

	name: str
	expected: Any
	actual: Any
	status: str
	message: str
	reason: str = ""
	impact: str = ""


@dataclass(slots=True)
class FileCheck:
	"""Represents the availability state of an artifact file."""

	name: str
	path: str
	exists: bool
	status: str
	message: str


@dataclass(slots=True)
class ExperimentSummary:
	"""Summarizes the discovered experiment artifacts and results."""

	experiment_path: str | None
	args_path: str | None
	results_path: str | None
	last_pt_path: str | None
	runtime_mode: str | None
	current_checkpoint_path: str | None
	current_checkpoint_epoch: int | None
	current_experiment_name: str | None
	resume_compatibility_status: str | None
	results_rows: int
	last_epoch: int | None
	best_epoch: int | None
	best_metric_name: str | None
	best_metric_value: float | None
	total_epochs_completed: int | None
	fastest_epoch_time: float | None
	slowest_epoch_time: float | None
	average_epoch_time: float | None
	median_epoch_time: float | None
	average_sec_per_it: float | None
	median_sec_per_it: float | None
	slowdown_percent: float | None
	latest_row: dict[str, Any] = field(default_factory=dict)
	runtime_audit: dict[str, Any] = field(default_factory=dict)
	performance: dict[str, Any] = field(default_factory=dict)
	gpu_z: dict[str, Any] = field(default_factory=dict)
	hwinfo: dict[str, Any] = field(default_factory=dict)
	thermal_correlation: dict[str, Any] = field(default_factory=dict)


@dataclass(slots=True)
class BenchmarkReport:
	"""Full JSON-serializable benchmark report payload."""

	generated_at: str
	project_root: str
	runs_root: str
	config_path: str
	config_loaded: bool
	config_error: str | None
	experiment: ExperimentSummary
	file_checks: list[FileCheck]
	comparisons: list[CheckResult]
	status_counts: dict[str, int]
	benchmark_score: int
	html_report_path: str | None
	csv_summary_path: str | None


def configure_logging() -> None:
	"""Configure console logging for a compact terminal report."""

	logging.basicConfig(level=logging.INFO, format="%(message)s")


def project_root_from_script(script_path: Path) -> Path:
	"""Return the CSCRS repository root from the benchmark script path."""

	return script_path.resolve().parent.parent


def load_production_config(config_path: Path) -> tuple[dict[str, Any], str | None]:
	"""Import the production configuration module and extract relevant values.

	The production config may raise at import time if the hardware environment is
	not suitable. This function captures that failure so the benchmark can
	continue producing a report instead of crashing.
	"""

	module_name = f"cscrs_production_config_{datetime.now(timezone.utc).timestamp():.0f}"
	spec = importlib.util.spec_from_file_location(module_name, config_path)
	if spec is None or spec.loader is None:
		return {}, f"Unable to load module spec from {config_path}"

	module = importlib.util.module_from_spec(spec)
	torch_module = None
	original_is_available = None

	try:
		import torch  # type: ignore

		torch_module = torch
		if hasattr(torch_module, "cuda") and hasattr(torch_module.cuda, "is_available"):
			original_is_available = torch_module.cuda.is_available
			torch_module.cuda.is_available = lambda: True  # type: ignore[assignment]
	except Exception:
		torch_module = None

	try:
		spec.loader.exec_module(module)
	except Exception as exc:  # pragma: no cover - defensive import guard.
		return {}, f"{type(exc).__name__}: {exc}"
	finally:
		if torch_module is not None and original_is_available is not None:
			torch_module.cuda.is_available = original_is_available  # type: ignore[assignment]

	values = {
		"cache": getattr(module, "USE_CACHE", None),
		"batch": getattr(module, "BATCH_SIZE", None),
		"workers": getattr(module, "WORKERS", None),
		"optimizer": getattr(module, "OPTIMIZER", None),
		"amp": getattr(module, "AMP", None),
		"plots": getattr(module, "PLOTS", None),
		"patience": getattr(module, "PATIENCE", None),
		"save_period": getattr(module, "SAVE_PERIOD", None),
		"epochs": getattr(module, "EPOCHS", None),
		"dataset_dir": getattr(module, "DATASET_DIR", None),
		"data_yaml": getattr(module, "DATA_YAML", None),
		"project_name": getattr(module, "PROJECT_NAME", None),
		"experiment_name": getattr(module, "EXPERIMENT_NAME", None),
	}

	return values, None


def strip_inline_comment(text: str) -> str:
	"""Remove YAML comments while preserving quoted content."""

	in_single = False
	in_double = False
	for index, character in enumerate(text):
		if character == "'" and not in_double:
			in_single = not in_single
		elif character == '"' and not in_single:
			in_double = not in_double
		elif character == "#" and not in_single and not in_double:
			return text[:index].rstrip()
	return text.strip()


def parse_scalar(value_text: str) -> Any:
	"""Parse a YAML scalar value using a small, dependency-free subset."""

	text = value_text.strip()
	if not text:
		return None

	lowered = text.lower()
	if lowered in {"true", "false"}:
		return lowered == "true"
	if lowered in {"null", "none", "~"}:
		return None

	try:
		return ast.literal_eval(text)
	except Exception:
		pass

	try:
		return int(text)
	except ValueError:
		pass

	try:
		return float(text)
	except ValueError:
		return text


def load_simple_yaml(path: Path) -> dict[str, Any]:
	"""Load a flat YAML mapping from disk.

	The benchmark only needs the top-level keys from Ultralytics' args file, so
	a narrow parser keeps the implementation dependency-free and predictable on
	Windows.
	"""

	data: dict[str, Any] = {}
	try:
		lines = path.read_text(encoding="utf-8").splitlines()
	except OSError:
		return data

	for line in lines:
		stripped = line.strip()
		if not stripped or stripped.startswith("#"):
			continue
		if ":" not in line:
			continue
		key_text, value_text = line.split(":", 1)
		key = key_text.strip()
		value = strip_inline_comment(value_text)
		if key:
			data[key] = parse_scalar(value)
	return data


def load_yaml_mapping(path: Path) -> dict[str, Any]:
	"""Load YAML content with a safe fallback when PyYAML is unavailable."""

	try:
		import yaml  # type: ignore
	except Exception:
		return load_simple_yaml(path)

	try:
		loaded = yaml.safe_load(path.read_text(encoding="utf-8"))
	except OSError:
		return {}
	except Exception:
		return load_simple_yaml(path)

	return loaded if isinstance(loaded, dict) else {}


IMAGE_EXTENSIONS = (
	".jpg",
	".jpeg",
	".png",
	".bmp",
	".tif",
	".tiff",
	".webp",
	".avif",
)


def is_truthy(value: Any) -> bool:
	"""Interpret common YAML and CLI values as booleans."""

	if isinstance(value, bool):
		return value
	if value is None:
		return False
	text = str(value).strip().lower()
	return text not in {"", "0", "false", "none", "null", "no", "off"}


def normalize_text(value: Any) -> str:
	"""Normalize a value for header and keyword matching."""

	text = str(value).strip().lower()
	for character in "[](){}:/\\-_,;|." :
		text = text.replace(character, " ")
	return " ".join(text.split())


def detect_csv_delimiter(path: Path) -> str:
	"""Guess the delimiter used by a telemetry CSV file."""

	try:
		sample = path.read_text(encoding="utf-8", errors="ignore")[:8192]
	except OSError:
		return ","

	if not sample:
		return ","
	comma_count = sample.count(",")
	semicolon_count = sample.count(";")
	if semicolon_count > comma_count:
		return ";"
	return ","


def read_csv_records(path: Path) -> list[dict[str, str]]:
	"""Read a CSV file with delimiter detection and graceful failure handling."""

	try:
		with path.open("r", encoding="utf-8", newline="") as handle:
			reader = csv.DictReader(handle, delimiter=detect_csv_delimiter(path))
			return list(reader)
	except OSError:
		return []


def find_latest_matching_file(logs_root: Path, keywords: tuple[str, ...], excluded_names: set[str] | None = None) -> Path | None:
	"""Find the newest CSV telemetry file whose name matches the given keywords."""

	excluded_names = excluded_names or set()
	candidates: list[Path] = []
	for path in logs_root.rglob("*.csv"):
		if path.name.lower() in excluded_names:
			continue
		normalized_name = normalize_text(path.name)
		if any(keyword in normalized_name for keyword in keywords):
			candidates.append(path)
	if not candidates:
		return None
	return max(candidates, key=lambda item: (item.stat().st_mtime, item.name.lower()))


def read_numeric_series(rows: list[dict[str, Any]], column_name: str) -> list[float]:
	"""Extract numeric values from a CSV column."""

	values: list[float] = []
	for row in rows:
		value = to_float(row.get(column_name))
		if value is not None:
			values.append(value)
	return values


def read_boolean_series(rows: list[dict[str, Any]], column_name: str) -> list[bool]:
	"""Extract boolean-like values from a CSV column."""

	values: list[bool] = []
	for row in rows:
		raw_value = row.get(column_name)
		if raw_value is None:
			continue
		text = str(raw_value).strip().lower()
		if text in {"1", "true", "yes", "on"}:
			values.append(True)
		elif text in {"0", "false", "no", "off"}:
			values.append(False)
	return values


def select_columns(headers: list[str], include_terms: tuple[str, ...], exclude_terms: tuple[str, ...] = ()) -> list[str]:
	"""Return columns whose normalized names contain all include terms and none of the exclude terms."""

	selected: list[str] = []
	for header in headers:
		normalized = normalize_text(header)
		if include_terms and not all(term in normalized for term in include_terms):
			continue
		if any(term in normalized for term in exclude_terms):
			continue
		selected.append(header)
	return selected


def summarize_numeric_values(values: list[float]) -> dict[str, Any]:
	"""Calculate common statistics for a numeric series."""

	if not values:
		return {"samples": 0, "average": None, "median": None, "maximum": None, "minimum": None}
	return {
		"samples": len(values),
		"average": statistics.mean(values),
		"median": statistics.median(values),
		"maximum": max(values),
		"minimum": min(values),
	}


def count_training_images(dataset_dir: Path | None) -> int | None:
	"""Count training images inside the dataset directory."""

	if dataset_dir is None:
		return None
	train_images_dir = dataset_dir / "train" / "images"
	if not train_images_dir.exists():
		return None
	count = 0
	for path in train_images_dir.rglob("*"):
		if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
			count += 1
	return count


def determine_run_mode(args_data: dict[str, Any]) -> str:
	"""Classify the run as resume or fresh."""

	return "Resume" if is_truthy(args_data.get("resume")) else "Fresh"


def resolve_checkpoint_path(args_data: dict[str, Any]) -> Path | None:
	"""Resolve the checkpoint path used by the current run."""

	resume_value = args_data.get("resume")
	if is_truthy(resume_value):
		return Path(str(resume_value))
	model_value = args_data.get("model")
	if model_value:
		return Path(str(model_value))
	return None


def resolve_checkpoint_epoch(last_epoch: int | None) -> int | None:
	"""Return the last checkpoint epoch from the observed training history."""

	return last_epoch


def resolve_resume_compatibility(run_mode: str, checkpoint_path: Path | None) -> tuple[str, str]:
	"""Determine whether the current checkpoint is compatible with resume semantics."""

	if run_mode == "Fresh":
		return "PASS", "Fresh run - no resume checkpoint required."
	if checkpoint_path is None:
		return "FAIL", "Resume was requested but no checkpoint path was provided."
	if checkpoint_path.exists() and checkpoint_path.is_file() and checkpoint_path.suffix.lower() == ".pt":
		return "PASS", "Resume checkpoint exists and is a readable .pt file."
	if checkpoint_path.exists():
		return "WARN", "Resume path exists but is not a checkpoint file."
	return "FAIL", "Resume checkpoint is missing from disk."


def metric_name_for_average_sec_per_it(batch_size: int | None, dataset_dir: Path | None) -> str:
	"""Explain how sec/it was derived for the report."""

	if batch_size is None or batch_size <= 0 or dataset_dir is None:
		return "Unavailable"
	return "epoch_time / ceil(train_images / batch_size)"


def build_runtime_audit(args_data: dict[str, Any], summary: ExperimentSummary) -> dict[str, Any]:
	"""Assemble runtime configuration audit details."""

	run_mode = determine_run_mode(args_data)
	checkpoint_path = resolve_checkpoint_path(args_data)
	checkpoint_status, checkpoint_reason = resolve_resume_compatibility(run_mode, checkpoint_path)
	current_experiment_name = str(args_data.get("name") or (Path(summary.experiment_path).name if summary.experiment_path else "<unknown>"))
	return {
		"run_mode": run_mode,
		"current_checkpoint_path": str(checkpoint_path) if checkpoint_path is not None else None,
		"current_checkpoint_epoch": resolve_checkpoint_epoch(summary.last_epoch),
		"current_experiment_name": current_experiment_name,
		"resume_compatibility_status": checkpoint_status,
		"resume_compatibility_reason": checkpoint_reason,
	}


def compute_epoch_metrics(
	rows: list[dict[str, str]],
	batch_size: int | None,
	dataset_dir: Path | None,
) -> dict[str, Any]:
	"""Calculate training performance metrics from results.csv."""

	epoch_times: list[float] = []
	sec_per_it: list[float] = []
	batches_per_epoch: int | None = None
	train_image_count = count_training_images(dataset_dir)
	if batch_size is not None and batch_size > 0 and train_image_count is not None:
		batches_per_epoch = max(1, math.ceil(train_image_count / batch_size))

	for row in rows:
		epoch_time = to_float(row.get("time"))
		if epoch_time is None:
			continue
		epoch_times.append(epoch_time)
		if batches_per_epoch is not None:
			sec_per_it.append(epoch_time / batches_per_epoch)

	if not epoch_times:
		return {
			"total_epochs_completed": 0,
			"fastest_epoch_time": None,
			"slowest_epoch_time": None,
			"average_epoch_time": None,
			"median_epoch_time": None,
			"average_sec_per_it": None,
			"median_sec_per_it": None,
			"slowdown_percent": None,
			"throughput_note": "No epoch timing data available.",
		}

	first_five = epoch_times[:5]
	late_epochs = epoch_times[5:]
	slowdown_percent: float | None = None
	throughput_note = ""
	if first_five and late_epochs:
		early_median = statistics.median(first_five)
		late_median = statistics.median(late_epochs)
		if early_median:
			slowdown_percent = ((late_median - early_median) / early_median) * 100.0
			throughput_note = "Slowdown uses median(epoch 6-last) vs median(epoch 1-5)."
	else:
		throughput_note = "Slowdown is unavailable because fewer than six epochs were recorded."

	average_sec_per_it = statistics.mean(sec_per_it) if sec_per_it else None
	median_sec_per_it = statistics.median(sec_per_it) if sec_per_it else None

	return {
		"total_epochs_completed": len(epoch_times),
		"fastest_epoch_time": min(epoch_times),
		"slowest_epoch_time": max(epoch_times),
		"average_epoch_time": statistics.mean(epoch_times),
		"median_epoch_time": statistics.median(epoch_times),
		"average_sec_per_it": average_sec_per_it,
		"median_sec_per_it": median_sec_per_it,
		"slowdown_percent": slowdown_percent,
		"throughput_note": throughput_note,
		"batches_per_epoch": batches_per_epoch,
		"train_image_count": train_image_count,
	}


def resolve_numeric_from_columns(rows: list[dict[str, Any]], headers: list[str], include_terms: tuple[str, ...], exclude_terms: tuple[str, ...] = ()) -> list[float]:
	"""Collect numeric values from matching columns in a CSV table."""

	values: list[float] = []
	for column in select_columns(headers, include_terms, exclude_terms):
		values.extend(read_numeric_series(rows, column))
	return values


def resolve_boolean_rate(rows: list[dict[str, Any]], headers: list[str], include_terms: tuple[str, ...]) -> dict[str, Any]:
	"""Calculate the proportion of truthy values in matching CSV columns."""

	selected = select_columns(headers, include_terms)
	all_values: list[bool] = []
	for column in selected:
		all_values.extend(read_boolean_series(rows, column))
	if not all_values:
		return {"samples": 0, "average": None, "maximum": None, "truth_rate": None}
	truth_rate = sum(1 for item in all_values if item) / len(all_values)
	return {
		"samples": len(all_values),
		"average": statistics.mean([1.0 if item else 0.0 for item in all_values]),
		"maximum": 1.0 if any(all_values) else 0.0,
		"truth_rate": truth_rate,
	}


def parse_gpu_z_log(path: Path | None) -> dict[str, Any]:
	"""Parse a GPU-Z telemetry CSV file if one exists."""

	if path is None or not path.exists():
		return {"path": None, "status": "WARN", "message": "GPU-Z CSV log not found.", "metrics": {}}
	rows = read_csv_records(path)
	if not rows:
		return {"path": str(path), "status": "WARN", "message": "GPU-Z CSV log could not be read.", "metrics": {}}
	headers = list(rows[0].keys())
	metrics = {
		"gpu_clock": summarize_numeric_values(resolve_numeric_from_columns(rows, headers, ("gpu", "clock"), ("memory", "shader"))),
		"gpu_temperature": summarize_numeric_values(resolve_numeric_from_columns(rows, headers, ("gpu", "temperature"))),
		"gpu_power": summarize_numeric_values(resolve_numeric_from_columns(rows, headers, ("gpu", "power"))),
		"gpu_utilization": summarize_numeric_values(resolve_numeric_from_columns(rows, headers, ("gpu", "util"))),
	}
	return {"path": str(path), "status": "PASS", "message": "GPU-Z CSV log parsed.", "metrics": metrics}


def parse_hwinfo_log(path: Path | None) -> dict[str, Any]:
	"""Parse an HWiNFO sensor CSV file if one exists."""

	if path is None or not path.exists():
		return {"path": None, "status": "WARN", "message": "HWiNFO CSV log not found.", "metrics": {}}
	rows = read_csv_records(path)
	if not rows:
		return {"path": str(path), "status": "WARN", "message": "HWiNFO CSV log could not be read.", "metrics": {}}
	headers = list(rows[0].keys())
	package_temp_values = resolve_numeric_from_columns(rows, headers, ("cpu", "package", "temp"))
	max_temp_values = resolve_numeric_from_columns(rows, headers, ("cpu", "max", "temp"))
	average_temp_values = resolve_numeric_from_columns(rows, headers, ("cpu", "temp"), ("gpu",))
	thermal_throttling = resolve_boolean_rate(rows, headers, ("thermal", "throttl"))
	package_throttling = resolve_boolean_rate(rows, headers, ("package", "throttl"))
	core_effective_clock_values = resolve_numeric_from_columns(rows, headers, ("core", "effective", "clock"))
	package_power_values = resolve_numeric_from_columns(rows, headers, ("package", "power"))
	metrics = {
		"cpu_package_temp": summarize_numeric_values(package_temp_values),
		"cpu_max_temp": summarize_numeric_values(max_temp_values),
		"cpu_average_temp": summarize_numeric_values(average_temp_values),
		"thermal_throttling": thermal_throttling,
		"package_throttling": package_throttling,
		"core_effective_clock": summarize_numeric_values(core_effective_clock_values),
		"package_power": summarize_numeric_values(package_power_values),
	}
	return {"path": str(path), "status": "PASS", "message": "HWiNFO CSV log parsed.", "metrics": metrics}


def build_thermal_correlation(gpu_z: dict[str, Any], hwinfo: dict[str, Any], performance: dict[str, Any]) -> dict[str, Any]:
	"""Estimate the most likely bottleneck using the available evidence only."""

	evidence: list[str] = []
	label = "Unknown"

	gpu_metrics = gpu_z.get("metrics", {}) if isinstance(gpu_z, dict) else {}
	hw_metrics = hwinfo.get("metrics", {}) if isinstance(hwinfo, dict) else {}
	gpu_util_avg = (gpu_metrics.get("gpu_utilization") or {}).get("average")
	gpu_power_avg = (gpu_metrics.get("gpu_power") or {}).get("average")
	gpu_power_max = (gpu_metrics.get("gpu_power") or {}).get("maximum")
	gpu_clock_avg = (gpu_metrics.get("gpu_clock") or {}).get("average")
	package_temp_max = (hw_metrics.get("cpu_package_temp") or {}).get("maximum")
	cpu_max_temp_max = (hw_metrics.get("cpu_max_temp") or {}).get("maximum")
	package_throttle_rate = (hw_metrics.get("package_throttling") or {}).get("truth_rate")
	thermal_throttle_rate = (hw_metrics.get("thermal_throttling") or {}).get("truth_rate")
	package_power_avg = (hw_metrics.get("package_power") or {}).get("average")
	core_clock_avg = (hw_metrics.get("core_effective_clock") or {}).get("average")
	slowdown_percent = performance.get("slowdown_percent") if isinstance(performance, dict) else None

	if thermal_throttle_rate is not None and thermal_throttle_rate > 0:
		label = "CPU Thermal"
		evidence.append(f"HWiNFO reports thermal throttling on {thermal_throttle_rate:.0%} of samples.")
	if package_throttle_rate is not None and package_throttle_rate > 0:
		label = "CPU Thermal"
		evidence.append(f"Package throttling is present on {package_throttle_rate:.0%} of samples.")
	if package_temp_max is not None and package_temp_max >= 90:
		label = "CPU Thermal"
		evidence.append(f"CPU package temperature peaks at {package_temp_max:.1f} C.")
	if cpu_max_temp_max is not None and cpu_max_temp_max >= 90:
		label = "CPU Thermal"
		evidence.append(f"CPU max temperature peaks at {cpu_max_temp_max:.1f} C.")

	if label == "Unknown" and gpu_util_avg is not None and gpu_util_avg >= 85:
		label = "GPU Compute"
		evidence.append(f"GPU utilization averages {gpu_util_avg:.1f}%, indicating sustained device-side work.")
		if gpu_clock_avg is not None:
			evidence.append(f"GPU clock averages {gpu_clock_avg:.1f} MHz.")
		if gpu_power_avg is not None:
			evidence.append(f"GPU power averages {gpu_power_avg:.1f} W.")

	if label == "Unknown" and slowdown_percent is not None and gpu_util_avg is not None and gpu_util_avg < 65:
		if package_throttle_rate in {None, 0} and thermal_throttle_rate in {None, 0}:
			label = "Data Loader/Disk"
			evidence.append(f"GPU utilization averages {gpu_util_avg:.1f}%, which is low relative to the measured slowdown.")
			if slowdown_percent > 10:
				evidence.append(f"Late-epoch median time is {slowdown_percent:.1f}% slower than early-epoch median time.")

	if label == "Unknown" and gpu_util_avg is not None and gpu_power_avg is not None and gpu_power_max is not None:
		if gpu_util_avg >= 80 and gpu_power_max > 0 and gpu_power_avg >= 0.9 * gpu_power_max:
			label = "Power Limit"
			evidence.append(f"GPU power averages {gpu_power_avg:.1f} W and stays near the observed maximum of {gpu_power_max:.1f} W.")

	if label == "Unknown" and core_clock_avg is not None and package_power_avg is not None and slowdown_percent is not None:
		if core_clock_avg > 0 and package_power_avg > 0 and slowdown_percent > 0:
			evidence.append(f"CPU package power averages {package_power_avg:.1f} W and core effective clock averages {core_clock_avg:.1f} MHz.")

	if label == "Unknown" and not evidence:
		evidence.append("Insufficient GPU-Z, HWiNFO, and results.csv evidence to classify the bottleneck.")

	return {"label": label, "evidence": evidence}


def calculate_benchmark_score(report: BenchmarkReport) -> int:
	"""Generate a bounded benchmark score from configuration, thermal, throughput, and artifact quality."""

	score = 100.0
	fail_count = report.status_counts.get("FAIL", 0)
	warn_count = report.status_counts.get("WARN", 0)
	score -= fail_count * 12.0
	score -= warn_count * 3.0
	performance = report.experiment.performance
	slowdown_percent = performance.get("slowdown_percent")
	if slowdown_percent is not None:
		score -= min(20.0, abs(float(slowdown_percent)) * 0.25)
		if abs(float(slowdown_percent)) > 20:
			score -= 5.0
	gpu_metrics = report.experiment.gpu_z.get("metrics", {}) if isinstance(report.experiment.gpu_z, dict) else {}
	hw_metrics = report.experiment.hwinfo.get("metrics", {}) if isinstance(report.experiment.hwinfo, dict) else {}
	thermal_rates = [
		(hw_metrics.get("thermal_throttling") or {}).get("truth_rate"),
		(hw_metrics.get("package_throttling") or {}).get("truth_rate"),
	]
	for rate in thermal_rates:
		if rate:
			score -= min(10.0, float(rate) * 20.0)
	gpu_util_avg = (gpu_metrics.get("gpu_utilization") or {}).get("average")
	if gpu_util_avg is not None and gpu_util_avg < 50:
		score -= 10.0
	missing_artifacts = sum(1 for item in report.file_checks if not item.exists)
	score -= min(20.0, missing_artifacts * 7.0)
	if report.experiment.gpu_z.get("status") != "PASS":
		score -= 2.0
	if report.experiment.hwinfo.get("status") != "PASS":
		score -= 2.0
	return max(0, min(100, int(round(score))))


def html_table(headers: list[str], rows: list[list[str]], table_class: str = "") -> str:
	"""Render a simple HTML table."""

	class_attr = f' class="{table_class}"' if table_class else ""
	parts = [f"<table{class_attr}>", "<thead><tr>"]
	for header in headers:
		parts.append(f"<th>{escape(header)}</th>")
	parts.append("</tr></thead><tbody>")
	for row in rows:
		parts.append("<tr>")
		for cell in row:
			parts.append(f"<td>{cell}</td>")
		parts.append("</tr>")
	parts.append("</tbody></table>")
	return "".join(parts)


def css_status(status: str) -> str:
	"""Map a status value to a CSS class name."""

	return f"status-{status.lower()}"


def build_html_report(project_root: Path, report: BenchmarkReport, report_path: Path) -> None:
	"""Generate a standalone HTML benchmark report without external assets."""

	style = """
<style>
body { font-family: Segoe UI, Arial, sans-serif; margin: 24px; color: #1f2937; background: #f7f8fb; }
.card { background: #fff; border: 1px solid #dbe3ea; border-radius: 12px; padding: 16px 18px; margin-bottom: 18px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05); }
h1, h2 { margin: 0 0 12px 0; }
h1 { font-size: 28px; }
h2 { font-size: 18px; }
table { width: 100%; border-collapse: collapse; margin-top: 8px; }
th, td { border: 1px solid #dbe3ea; padding: 8px 10px; text-align: left; vertical-align: top; }
th { background: #eff4f8; }
.status-pass { color: #166534; font-weight: 700; }
.status-warn { color: #92400e; font-weight: 700; }
.status-fail { color: #b91c1c; font-weight: 700; }
.score { font-size: 36px; font-weight: 800; }
.muted { color: #6b7280; }
</style>
"""

	def status_cell(status: str) -> str:
		return f'<span class="{css_status(status)}">{escape(status)}</span>'

	comparison_rows = [
		[
			escape(item.name),
			escape(format_value(item.expected)),
			escape(format_value(item.actual)),
			escape(item.reason or item.message),
			escape(item.impact or ""),
			status_cell(item.status),
		]
		for item in report.comparisons
	]
	file_rows = [
		[
			escape(item.name),
			status_cell(item.status),
			escape(item.path),
			escape(item.message),
		]
		for item in report.file_checks
	]
	runtime = report.experiment.runtime_audit
	performance = report.experiment.performance
	gpu_metrics = report.experiment.gpu_z.get("metrics", {}) if isinstance(report.experiment.gpu_z, dict) else {}
	hw_metrics = report.experiment.hwinfo.get("metrics", {}) if isinstance(report.experiment.hwinfo, dict) else {}

	html_parts = ["<html><head><meta charset='utf-8'>", f"<title>CSCRS Benchmark Report</title>", style, "</head><body>"]
	html_parts.append("<div class='card'><h1>CSCRS Benchmark Report</h1>")
	html_parts.append(f"<div class='score'>Benchmark Score: {report.benchmark_score}/100</div>")
	html_parts.append(f"<div class='muted'>Generated {escape(report.generated_at)} | JSON {escape(str(report_path))}</div>")
	html_parts.append("</div>")

	html_parts.append("<div class='card'><h2>Configuration Summary</h2>")
	html_parts.append(html_table(["Check", "Expected", "Actual", "Reason", "Possible Impact", "Status"], comparison_rows, "comparison-table"))
	html_parts.append("</div>")

	html_parts.append("<div class='card'><h2>Runtime Audit</h2>")
	html_parts.append(html_table(["Field", "Value"], [
		["Resume or Fresh run", escape(format_value(runtime.get("run_mode")))],
		["Current checkpoint path", escape(format_value(runtime.get("current_checkpoint_path")))],
		["Last checkpoint epoch", escape(format_value(runtime.get("current_checkpoint_epoch")))],
		["Current experiment name", escape(format_value(runtime.get("current_experiment_name")))],
		["Resume compatibility status", f"{status_cell(runtime.get('resume_compatibility_status') or 'WARN')} {escape(runtime.get('resume_compatibility_reason') or '')}"],
	], "runtime-table"))
	html_parts.append("</div>")

	html_parts.append("<div class='card'><h2>Training Performance</h2>")
	html_parts.append(html_table(["Metric", "Value"], [
		["Total epochs completed", escape(format_value(performance.get("total_epochs_completed")))],
		["Fastest epoch", escape(format_value(performance.get("fastest_epoch_time")))],
		["Slowest epoch", escape(format_value(performance.get("slowest_epoch_time")))],
		["Average epoch time", escape(format_value(performance.get("average_epoch_time")))],
		["Median epoch time", escape(format_value(performance.get("median_epoch_time")))],
		["Average sec/it", escape(format_value(performance.get("average_sec_per_it")))],
		["Median sec/it", escape(format_value(performance.get("median_sec_per_it")))],
		["Slowdown %", escape(format_value(performance.get("slowdown_percent")))],
	], "performance-table"))
	html_parts.append("</div>")

	html_parts.append("<div class='card'><h2>Artifact Status</h2>")
	html_parts.append(html_table(["Artifact", "Status", "Path", "Message"], file_rows, "artifact-table"))
	html_parts.append("</div>")

	html_parts.append("<div class='card'><h2>Thermal Summary</h2>")
	html_parts.append(html_table(["Source", "Average", "Maximum", "Samples"], [
		["GPU Clock", escape(format_value((gpu_metrics.get("gpu_clock") or {}).get("average"))), escape(format_value((gpu_metrics.get("gpu_clock") or {}).get("maximum"))), escape(format_value((gpu_metrics.get("gpu_clock") or {}).get("samples")))],
		["GPU Temperature", escape(format_value((gpu_metrics.get("gpu_temperature") or {}).get("average"))), escape(format_value((gpu_metrics.get("gpu_temperature") or {}).get("maximum"))), escape(format_value((gpu_metrics.get("gpu_temperature") or {}).get("samples")))],
		["GPU Power", escape(format_value((gpu_metrics.get("gpu_power") or {}).get("average"))), escape(format_value((gpu_metrics.get("gpu_power") or {}).get("maximum"))), escape(format_value((gpu_metrics.get("gpu_power") or {}).get("samples")))],
		["GPU Utilization", escape(format_value((gpu_metrics.get("gpu_utilization") or {}).get("average"))), escape(format_value((gpu_metrics.get("gpu_utilization") or {}).get("maximum"))), escape(format_value((gpu_metrics.get("gpu_utilization") or {}).get("samples")))],
		["CPU Package Temp", escape(format_value((hw_metrics.get("cpu_package_temp") or {}).get("average"))), escape(format_value((hw_metrics.get("cpu_package_temp") or {}).get("maximum"))), escape(format_value((hw_metrics.get("cpu_package_temp") or {}).get("samples")))],
		["CPU Max Temp", escape(format_value((hw_metrics.get("cpu_max_temp") or {}).get("average"))), escape(format_value((hw_metrics.get("cpu_max_temp") or {}).get("maximum"))), escape(format_value((hw_metrics.get("cpu_max_temp") or {}).get("samples")))],
	], "thermal-table"))
	html_parts.append("</div>")

	html_parts.append("<div class='card'><h2>Thermal Correlation</h2>")
	html_parts.append(f"<p><strong>Likely Bottleneck:</strong> {escape(report.experiment.thermal_correlation.get('label', 'Unknown'))}</p>")
	html_parts.append("<ul>")
	for item in report.experiment.thermal_correlation.get("evidence", []):
		html_parts.append(f"<li>{escape(str(item))}</li>")
	html_parts.append("</ul></div>")

	html_parts.append("</body></html>")
	report_path.write_text("".join(html_parts), encoding="utf-8")


def save_csv_summary(report: BenchmarkReport, report_path: Path, project_root: Path) -> Path:
	"""Persist the compact benchmark summary CSV in tools/logs."""

	summary_path = report_path.parent / "benchmark_summary.csv"
	with summary_path.open("w", encoding="utf-8", newline="") as handle:
		writer = csv.DictWriter(
			handle,
			fieldnames=["experiment", "epochs", "avg sec/it", "slowdown %", "benchmark score"],
		)
		writer.writeheader()
		writer.writerow(
			{
				"experiment": report.experiment.current_experiment_name or report.experiment.experiment_path or "<unknown>",
				"epochs": report.experiment.total_epochs_completed,
				"avg sec/it": report.experiment.average_sec_per_it,
				"slowdown %": report.experiment.slowdown_percent,
				"benchmark score": report.benchmark_score,
			}
		)
	return summary_path


def load_results_rows(path: Path) -> list[dict[str, str]]:
	"""Read ``results.csv`` into a list of dictionaries."""

	try:
		with path.open("r", encoding="utf-8", newline="") as handle:
			reader = csv.DictReader(handle)
			return list(reader)
	except OSError:
		return []


def to_float(value: Any) -> float | None:
	"""Convert a value to ``float`` when possible."""

	if value is None:
		return None
	if isinstance(value, bool):
		return float(value)
	if isinstance(value, (int, float)):
		return float(value)
	try:
		return float(str(value).strip())
	except (TypeError, ValueError):
		return None


def summarize_results(rows: list[dict[str, str]], results_path: Path, last_pt_path: Path) -> ExperimentSummary:
	"""Summarize the discovered run artifacts and training history."""

	latest_row: dict[str, Any] = {}
	last_epoch: int | None = None
	best_epoch: int | None = None
	best_metric_name: str | None = None
	best_metric_value: float | None = None

	if rows:
		latest_row = dict(rows[-1])
		last_epoch = _safe_int(latest_row.get("epoch"))

		for row in rows:
			epoch_value = _safe_int(row.get("epoch"))
			for metric_name in ("metrics/mAP50(B)", "metrics/mAP50(M)"):
				metric_value = to_float(row.get(metric_name))
				if metric_value is None:
					continue
				if best_metric_value is None or metric_value > best_metric_value:
					best_metric_value = metric_value
					best_metric_name = metric_name
					best_epoch = epoch_value

	return ExperimentSummary(
		experiment_path=str(results_path.parent),
		args_path=str(results_path.parent / "args.yaml") if (results_path.parent / "args.yaml").exists() else None,
		results_path=str(results_path) if results_path.exists() else None,
		last_pt_path=str(last_pt_path) if last_pt_path.exists() else None,
		runtime_mode=None,
		current_checkpoint_path=None,
		current_checkpoint_epoch=None,
		current_experiment_name=None,
		resume_compatibility_status=None,
		results_rows=len(rows),
		last_epoch=last_epoch,
		best_epoch=best_epoch,
		best_metric_name=best_metric_name,
		best_metric_value=best_metric_value,
		total_epochs_completed=None,
		fastest_epoch_time=None,
		slowest_epoch_time=None,
		average_epoch_time=None,
		median_epoch_time=None,
		average_sec_per_it=None,
		median_sec_per_it=None,
		slowdown_percent=None,
		latest_row=latest_row,
		runtime_audit={},
		performance={},
		gpu_z={},
		hwinfo={},
		thermal_correlation={},
	)


def _safe_int(value: Any) -> int | None:
	"""Convert a value to ``int`` when possible."""

	try:
		if value is None:
			return None
		return int(float(str(value).strip()))
	except (TypeError, ValueError):
		return None


def locate_latest_experiment(runs_root: Path) -> Path | None:
	"""Return the newest experiment directory under ``runs/production_engine``."""

	args_files = list(runs_root.rglob("args.yaml"))
	if args_files:
		candidates = [item.parent for item in args_files if item.parent.is_dir()]
	else:
		candidates = [item for item in runs_root.iterdir() if item.is_dir()]

	if not candidates:
		return None

	return max(candidates, key=lambda path: (path.stat().st_mtime, path.name.lower()))


def compare_expected_actual(expected: dict[str, Any], actual: dict[str, Any]) -> list[CheckResult]:
	"""Compare the selected production settings against the run arguments."""

	comparisons: list[CheckResult] = []
	for field_name in ("cache", "batch", "workers", "optimizer", "amp", "plots", "patience", "save_period", "epochs"):
		expected_value = expected.get(field_name)
		actual_value = actual.get(field_name)
		label = field_name.upper()

		if expected_value is None:
			comparisons.append(
				CheckResult(
					name=field_name,
					expected=None,
					actual=actual_value,
					status="WARN",
					message="Expected value is unavailable from production_config.py.",
					reason="Expected configuration value is unavailable from production_config.py.",
					impact="Drift cannot be assessed for this field.",
				)
			)
			continue

		if actual_value is None:
			comparisons.append(
				CheckResult(
					name=field_name,
					expected=expected_value,
					actual=None,
					status="WARN",
					message="Value is missing from args.yaml.",
					reason=f"{label} is missing from args.yaml.",
					impact="The benchmark cannot confirm whether this setting drifted.",
				)
			)
			continue

		if expected_value == actual_value:
			status = "PASS"
			reason = f"Expected {format_value(expected_value)} and actual {format_value(actual_value)} match."
			impact = "No configuration drift detected for this field."
			message = reason
		else:
			status = "FAIL"
			reason = f"Expected {format_value(expected_value)} but actual is {format_value(actual_value)}."
			if field_name == "cache":
				impact = "Resume training is using checkpoint-derived cache settings instead of the current production cache configuration."
			elif field_name in {"batch", "workers", "amp", "optimizer"}:
				impact = "Training throughput or numerical behavior may differ from the validated production baseline."
			elif field_name in {"patience", "save_period", "epochs"}:
				impact = "Checkpoint cadence or training duration may diverge from the production schedule."
			else:
				impact = "Production reproducibility may be affected."
			message = reason

		comparisons.append(
			CheckResult(
				name=field_name,
				expected=expected_value,
				actual=actual_value,
				status=status,
				message=message,
				reason=reason,
				impact=impact,
			)
		)

	return comparisons


def build_file_checks(experiment_path: Path | None) -> list[FileCheck]:
	"""Build existence checks for the key benchmark files."""

	checks: list[FileCheck] = []
	if experiment_path is None:
		checks.append(
			FileCheck(
				name="args.yaml",
				path="<missing experiment>",
				exists=False,
				status="WARN",
				message="No experiment directory was discovered.",
			)
		)
		return checks

	for relative_name in ("args.yaml", "results.csv", "weights/last.pt"):
		path = experiment_path / relative_name
		exists = path.exists()
		status = "PASS" if exists else "WARN"
		message = "Found." if exists else "File is missing."
		checks.append(
			FileCheck(
				name=relative_name,
				path=str(path),
				exists=exists,
				status=status,
				message=message,
			)
		)
	return checks


def format_value(value: Any) -> str:
	"""Format a value for terminal output."""

	if isinstance(value, Path):
		return str(value)
	if isinstance(value, float):
		return f"{value:.4f}".rstrip("0").rstrip(".")
	if value is None:
		return "<missing>"
	return str(value)


def status_counts(
	comparisons: list[CheckResult],
	file_checks: list[FileCheck],
	config_loaded: bool,
	extra_statuses: list[str] | None = None,
) -> dict[str, int]:
	"""Aggregate PASS/WARN/FAIL counts for the report."""

	counts = {"PASS": 0, "WARN": 0, "FAIL": 0}
	for item in file_checks:
		counts[item.status] = counts.get(item.status, 0) + 1
	for item in comparisons:
		counts[item.status] = counts.get(item.status, 0) + 1
	for status in extra_statuses or []:
		counts[status] = counts.get(status, 0) + 1
	if not config_loaded:
		counts["FAIL"] += 1
	return counts


def build_report(project_root: Path) -> BenchmarkReport:
	"""Collect files, configuration values, and comparison results."""

	config_path = project_root / "configs" / "production_config.py"
	runs_root = project_root / "runs" / "production_engine"

	config_values, config_error = load_production_config(config_path)
	experiment_path = locate_latest_experiment(runs_root)

	args_path = experiment_path / "args.yaml" if experiment_path is not None else None
	results_path = experiment_path / "results.csv" if experiment_path is not None else None
	last_pt_path = experiment_path / "weights" / "last.pt" if experiment_path is not None else None
	logs_root = project_root / "tools" / "logs"

	args_data = load_yaml_mapping(args_path) if args_path is not None and args_path.exists() else {}
	rows = load_results_rows(results_path) if results_path is not None and results_path.exists() else []

	summary = summarize_results(rows, results_path or runs_root / "results.csv", last_pt_path or runs_root / "weights" / "last.pt")
	metric_batch = _safe_int(args_data.get("batch")) or _safe_int(config_values.get("batch"))
	dataset_dir_value = config_values.get("dataset_dir")
	dataset_dir = Path(dataset_dir_value) if dataset_dir_value else None
	performance = compute_epoch_metrics(rows, metric_batch, dataset_dir)
	runtime_audit = build_runtime_audit(args_data, summary)
	gpu_z_path = find_latest_matching_file(logs_root, ("gpu z", "gpuz", "gpu-z", "gpuz"), {"benchmark_summary.csv"})
	hwinfo_path = find_latest_matching_file(logs_root, ("hwinfo", "sensor", "sensors"), {"benchmark_summary.csv"})
	gpu_z = parse_gpu_z_log(gpu_z_path)
	hwinfo = parse_hwinfo_log(hwinfo_path)
	thermal_correlation = build_thermal_correlation(gpu_z, hwinfo, performance)

	summary.experiment_path = str(experiment_path) if experiment_path is not None else None
	summary.args_path = str(args_path) if args_path is not None and args_path.exists() else None
	summary.results_path = str(results_path) if results_path is not None and results_path.exists() else None
	summary.last_pt_path = str(last_pt_path) if last_pt_path is not None and last_pt_path.exists() else None
	summary.runtime_mode = runtime_audit["run_mode"]
	summary.current_checkpoint_path = runtime_audit["current_checkpoint_path"]
	summary.current_checkpoint_epoch = runtime_audit["current_checkpoint_epoch"]
	summary.current_experiment_name = runtime_audit["current_experiment_name"]
	summary.resume_compatibility_status = runtime_audit["resume_compatibility_status"]
	summary.total_epochs_completed = performance["total_epochs_completed"]
	summary.fastest_epoch_time = performance["fastest_epoch_time"]
	summary.slowest_epoch_time = performance["slowest_epoch_time"]
	summary.average_epoch_time = performance["average_epoch_time"]
	summary.median_epoch_time = performance["median_epoch_time"]
	summary.average_sec_per_it = performance["average_sec_per_it"]
	summary.median_sec_per_it = performance["median_sec_per_it"]
	summary.slowdown_percent = performance["slowdown_percent"]
	summary.runtime_audit = runtime_audit
	summary.performance = performance
	summary.gpu_z = gpu_z
	summary.hwinfo = hwinfo
	summary.thermal_correlation = thermal_correlation

	file_checks = build_file_checks(experiment_path)
	comparisons = compare_expected_actual(config_values, args_data) if config_error is None else [
		CheckResult(
			name=field_name,
			expected=config_values.get(field_name),
			actual=args_data.get(field_name),
			status="WARN",
			message=f"Comparison skipped because production_config.py failed to import: {config_error}",
			reason=f"Comparison skipped because production_config.py failed to import: {config_error}",
			impact="Drift detection is not available until the configuration module can be imported.",
		)
		for field_name in ("cache", "batch", "workers", "optimizer", "amp", "plots", "patience", "save_period", "epochs")
	]
	report = BenchmarkReport(
		generated_at=datetime.now(timezone.utc).isoformat(),
		project_root=str(project_root),
		runs_root=str(runs_root),
		config_path=str(config_path),
		config_loaded=config_error is None,
		config_error=config_error,
		experiment=summary,
		file_checks=file_checks,
		comparisons=comparisons,
		status_counts=status_counts(
			comparisons,
			file_checks,
			config_error is None,
			[status for status in (gpu_z.get("status"), hwinfo.get("status")) if status],
		),
		benchmark_score=0,
		html_report_path=None,
		csv_summary_path=None,
	)
	report.benchmark_score = calculate_benchmark_score(report)

	return report


def ensure_output_directory(project_root: Path) -> Path:
	"""Create the benchmark report directory if needed."""

	output_dir = project_root / "tools" / "logs"
	output_dir.mkdir(parents=True, exist_ok=True)
	return output_dir


def save_report(project_root: Path, report: BenchmarkReport) -> Path:
	"""Persist the benchmark report as JSON under ``tools/logs``."""

	output_dir = ensure_output_directory(project_root)
	timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
	report_path = output_dir / f"benchmark_report_{timestamp}.json"

	with report_path.open("w", encoding="utf-8") as handle:
		json.dump(asdict(report), handle, indent=2, ensure_ascii=True, default=str)

	return report_path


def print_report(report: BenchmarkReport, report_path: Path) -> None:
	"""Render a clean benchmark summary in the terminal."""

	LOGGER.info("CSCRS Production Benchmark")
	LOGGER.info("Generated: %s", report.generated_at)
	LOGGER.info("Project root: %s", report.project_root)
	LOGGER.info("Runs root: %s", report.runs_root)
	LOGGER.info("Experiment: %s", report.experiment.experiment_path or "<none>")
	LOGGER.info("Report: %s", report_path)
	LOGGER.info("")

	if not report.config_loaded and report.config_error is not None:
		LOGGER.info("CONFIG: FAIL - %s", report.config_error)
		LOGGER.info("")
	else:
		LOGGER.info("CONFIG: PASS - production_config.py imported successfully.")
		LOGGER.info("")

	LOGGER.info("Artifacts")
	for item in report.file_checks:
		LOGGER.info("%-5s %-14s %s", item.status, item.name, item.path)
		if item.message:
			LOGGER.info("      %s", item.message)
	LOGGER.info("")

	LOGGER.info("Configuration Drift")
	LOGGER.info("%-5s %-12s %-12s %-12s %-42s %s", "STAT", "FIELD", "EXPECTED", "ACTUAL", "REASON", "POSSIBLE IMPACT")
	for item in report.comparisons:
		LOGGER.info(
			"%-5s %-12s %-12s %-12s %-42s %s",
			item.status,
			item.name,
			format_value(item.expected),
			format_value(item.actual),
			item.reason or item.message,
			item.impact,
		)
	LOGGER.info("")

	LOGGER.info("Runtime Configuration Audit")
	LOGGER.info("Resume or Fresh run: %s", format_value(report.experiment.runtime_mode))
	LOGGER.info("Current checkpoint path: %s", format_value(report.experiment.current_checkpoint_path))
	LOGGER.info("Last checkpoint epoch: %s", format_value(report.experiment.current_checkpoint_epoch))
	LOGGER.info("Current experiment name: %s", format_value(report.experiment.current_experiment_name))
	LOGGER.info("Resume compatibility status: %s", format_value(report.experiment.resume_compatibility_status))
	if report.experiment.runtime_audit.get("resume_compatibility_reason"):
		LOGGER.info("      %s", report.experiment.runtime_audit.get("resume_compatibility_reason"))
	LOGGER.info("")

	LOGGER.info("Training Performance Analysis")
	LOGGER.info("Total epochs completed: %s", format_value(report.experiment.total_epochs_completed))
	LOGGER.info("Fastest epoch: %s", format_value(report.experiment.fastest_epoch_time))
	LOGGER.info("Slowest epoch: %s", format_value(report.experiment.slowest_epoch_time))
	LOGGER.info("Average epoch time: %s", format_value(report.experiment.average_epoch_time))
	LOGGER.info("Median epoch time: %s", format_value(report.experiment.median_epoch_time))
	LOGGER.info("Average sec/it: %s", format_value(report.experiment.average_sec_per_it))
	LOGGER.info("Median sec/it: %s", format_value(report.experiment.median_sec_per_it))
	LOGGER.info("Slowdown %%: %s", format_value(report.experiment.slowdown_percent))
	if report.experiment.performance.get("throughput_note"):
		LOGGER.info("      %s", report.experiment.performance.get("throughput_note"))
	LOGGER.info("")

	LOGGER.info("Training Summary")
	LOGGER.info("Rows: %s", report.experiment.results_rows)
	LOGGER.info("Last epoch: %s", format_value(report.experiment.last_epoch))
	LOGGER.info("Best metric: %s @ epoch %s", format_value(report.experiment.best_metric_value), format_value(report.experiment.best_epoch))
	LOGGER.info("Best metric name: %s", format_value(report.experiment.best_metric_name))

	if report.experiment.latest_row:
		interesting_keys = [
			"epoch",
			"time",
			"metrics/mAP50(B)",
			"metrics/mAP50-95(B)",
			"metrics/mAP50(M)",
			"metrics/mAP50-95(M)",
		]
		LOGGER.info("")
		LOGGER.info("Latest row")
		for key in interesting_keys:
			if key in report.experiment.latest_row:
				LOGGER.info("%-22s %s", key + ":", format_value(report.experiment.latest_row.get(key)))

	LOGGER.info("")
	LOGGER.info("GPU-Z Telemetry")
	LOGGER.info("Status: %s", format_value(report.experiment.gpu_z.get("status")))
	LOGGER.info("Path: %s", format_value(report.experiment.gpu_z.get("path")))
	for metric_name, metric_data in report.experiment.gpu_z.get("metrics", {}).items():
		LOGGER.info(
			"%-24s avg=%s max=%s samples=%s",
			metric_name,
			format_value(metric_data.get("average")),
			format_value(metric_data.get("maximum")),
			format_value(metric_data.get("samples")),
		)
	if report.experiment.gpu_z.get("message"):
		LOGGER.info("      %s", report.experiment.gpu_z.get("message"))

	LOGGER.info("")
	LOGGER.info("HWiNFO Telemetry")
	LOGGER.info("Status: %s", format_value(report.experiment.hwinfo.get("status")))
	LOGGER.info("Path: %s", format_value(report.experiment.hwinfo.get("path")))
	for metric_name, metric_data in report.experiment.hwinfo.get("metrics", {}).items():
		if isinstance(metric_data, dict):
			LOGGER.info(
				"%-24s avg=%s max=%s samples=%s",
				metric_name,
				format_value(metric_data.get("average")),
				format_value(metric_data.get("maximum")),
				format_value(metric_data.get("samples")),
			)
		else:
			LOGGER.info("%-24s %s", metric_name, format_value(metric_data))
	if report.experiment.hwinfo.get("message"):
		LOGGER.info("      %s", report.experiment.hwinfo.get("message"))

	LOGGER.info("")
	LOGGER.info("Thermal Correlation")
	LOGGER.info("Likely Bottleneck: %s", format_value(report.experiment.thermal_correlation.get("label")))
	for item in report.experiment.thermal_correlation.get("evidence", []):
		LOGGER.info("      %s", item)

	LOGGER.info("")
	LOGGER.info("Benchmark Score: %d/100", report.benchmark_score)

	LOGGER.info("")
	LOGGER.info("Status counts: PASS=%d WARN=%d FAIL=%d", report.status_counts["PASS"], report.status_counts["WARN"], report.status_counts["FAIL"])


def main() -> int:
	"""Run the benchmark and return a process exit code."""

	configure_logging()
	script_path = Path(__file__).resolve()
	project_root = project_root_from_script(script_path)

	report = build_report(project_root)
	html_path = project_root / "tools" / "logs" / "benchmark_report.html"
	csv_path = project_root / "tools" / "logs" / "benchmark_summary.csv"
	report.html_report_path = str(html_path)
	report.csv_summary_path = str(csv_path)
	build_html_report(project_root, report, html_path)
	save_csv_summary(report, csv_path, project_root)
	report_path = save_report(project_root, report)
	print_report(report, report_path)

	if report.config_loaded and report.status_counts["FAIL"] == 0:
		return 0
	if report.status_counts["FAIL"] > 0:
		return 1
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
