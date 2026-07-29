# AI Dataset API

The AI Dataset API allows platform administrators to export core operational data, YOLO object detections, AI resolution results, and human verification metrics. The primary purpose of this API is to generate offline structured datasets (in CSV or Excel formats) to train, refine, and validate future iterations of the municipal issue detection and resolution verification machine learning models.

---

## Endpoint Summary

The AI Dataset controller registers exactly **1 operation** under `/api/v1/ai-dataset`:

| Method | Endpoint | Roles | Purpose |
| :---: | :--- | :--- | :--- |
| **GET** | `/api/v1/ai-dataset/export` | Super Admin | Export report lifecycle, image paths, and YOLO/similarity metrics as a CSV/Excel dataset. |

---

## AI Dataset Scope

The exported dataset compiles parameters across the following platform layers:
* **Civic Report YOLO Detections:** Mapped class names, model confidence thresholds, bounding box coordinates, and YOLO inference latencies.
* **Resolution AI Decisions:** Inception/ResNet before-and-after image similarity scores, GPS distance offsets, and model verification outcomes.
* **Image Assets:** File paths mapping original citizen submission photos and YOLO annotated images.
* **Operational Metrics:** Department assignment logs, manual review remarks, forwarding histories, support counts, and resolution durations.

---

## Dataset Source Records

The dataset aggregates columns from the following database records:

| Source | Included | Purpose / Data Exposed |
| :--- | :---: | :--- |
| `Report` | Yes | Supplies category type, priority, current status, description, location coords, and risk score. |
| `Department` | Yes | Supplies resolved department name. |
| `ReportDetection` | Yes | Supplies YOLO detected class, confidence score, mask area, bounding boxes, and model version. |
| `ReportImage` | Yes | Supplies relative storage file paths for original and YOLO annotated images. |
| `Resolution` | Yes | Supplies manual verification timestamps, decision status, and overall resolved status. |
| `ResolutionAttempt` | Yes | Supplies resolution image similarity score, GPS scene checks, YOLO error checks, and failure reasons. |
| `Assignment` | Yes | Supplies work assignment state timestamps (assigned, accepted, started, completed times). |
| `ReportForwardHistory` | Yes | Supplies department forwarding occurrences, routing reasons, and timestamps. |
| `ResolutionAIResult` | Yes | Supplies final AI verification classification, scene comparison scores, and model version. |

---

## Dataset Inclusion Rules

* **All Reports Included:** The dataset query loads **all reports** stored in the database (`db.query(Report).all()`), regardless of their age, category, or status.
* **Calculated Classification Flags:** To help filter records for offline model training, the service computes specific logical boolean flags for each row:
  * `Training Eligible`: Evaluated as `True` if a report was successfully resolved and passed verification (`bool(resolution and resolution.verification_passed)`).
  * `Gold Sample`: Evaluated as `True` if a report passed AI resolution verification without requiring human manual review (`bool(resolution and resolution.verification_passed and not resolution.manual_review)`).
  * `Detection Correct`: Evaluated as `True` if the YOLO model's `class_name` matched the final `issue_type` categorized on the report.

---

## Civic Detection Dataset Fields

The exported file structures columns into logical operational categories:

### 1. Report Metadata
* `Issue Type` (String): Final categorized issue type.
* `Department` (String): Mapped department name.
* `Priority` (String): Mapped priority.
* `Status` (String): Final report state.
* `Risk Score` (Float): Evaluated report risk score.
* `AI Confidence` (Float): Original report YOLO confidence.
* `Confidence Gap` (Float): Calculated as `100 - AI Confidence`.
* `Support Count` (Integer): Duplicate report support count.
* `Created At` / `Updated At` (Datetime): Timestamps.
* `Report Hour` (Integer): Submission hour of day.
* `Report Weekday` / `Report Month` (String): Calendrical parameters.
* `Is Weekend` (Boolean): Weekend flag.

### 2. Location Parameters
* `Latitude` / `Longitude` (Float): Geographical coordinate location.
* `Address` (String): Resolved physical address.

### 3. YOLO Detection Metrics
* `Detected Class` (String): YOLO prediction class.
* `Detection Confidence` (Float): YOLO prediction confidence score.
* `Mask Area` (Float): Segmented pixel area.
* `Bounding Box` (List): Array of coordinates.
* `BBox X1` / `BBox Y1` / `BBox X2` / `BBox Y2` (Float): Segmented coordinate corners.
* `Detection Correct` (Boolean): Class match check.
* `Model Version` (String): YOLO model version.
* `Inference Time (ms)` (Float): Model inference latency.

### 4. Resolution AI Verification Metrics
* `Resolution Passed` (Boolean): Mapped resolution outcome.
* `Verification Score` (Float): Comparison score.
* `Resolution Decision` (String): Verification category.
* `Manual Review` (Boolean): Flag indicating human override.
* `Attempt Number` (Integer): Count of worker resolution uploads.
* `Attempt Score` (Float): Similarity score of the latest upload.
* `Scene Similarity` (Float): Before/after similarity ratio.
* `Same Scene` (Boolean): AI scene identification check.
* `YOLO Issue Found` (Boolean): AI resolution block check.
* `Final AI Decision` (String): Final automated decision.

---

## Prediction vs Final-Label Semantics

* **Predictions:** Represent YOLO class outputs (`Detected Class`) or automated before/after similarities (`Attempt Score`) generated by models at runtime.
* **Final Labels:** Represent final system parameters (`Issue Type`) or administrator-reviewed outcomes (`Resolution Decision`). Administrators should utilize the `Gold Sample` and `Training Eligible` flags to separate raw model predictions from human-reviewed final system decisions.

---

## Dataset Privacy Characteristics

* **No Personal Data:** The exported spreadsheet does **not** contain Citizen or Worker user IDs, names, email addresses, or phone numbers.
* **Geographical Tracking:** The dataset **exposes raw GPS coordinates** (`Latitude`, `Longitude`) and resolved addresses.
* **Storage Paths:** Original and annotated image fields expose relative upload storage directory paths (e.g. `uploads/system_issues/...`), but do not leak server absolute path roots.

---

## Model / Platform Weights Semantics

`AI Dataset API operations do not modify model weights or persistent application state.`
The export route performs database selection, compiles dataframes in memory, and streams them to the client. It makes no updates to model checkpoints, YOLO configurations, or database records.

---

## Detailed Endpoint Specifications

---

## `GET /api/v1/ai-dataset/export`

### Purpose
Exports all system reports, YOLO detections, and AI resolution attempts in CSV or Excel spreadsheet format.

### Roles / Authorization
* Super Admin role only. Other roles (including City Admin) receive `403 Forbidden` (`"Only Super Admin can export AI dataset."`).

### Authentication
* Bearer Access Token required.

### Headers
* `Authorization: Bearer <access_token>`

### Query Parameters

| Name | Type | Required | Default | Constraints | Description |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `format` | String | No | `csv` | `csv` \| `excel` | Export spreadsheet format. |

### Validation Rules
* Format parameters outside of `csv` or `excel` return `422 Unprocessable Entity`.

### Rate Limit
* `No endpoint-specific rate limit verified.`

### Business Flow
1. Authenticates user and checks role permission. Throws `403` if role is not Super Admin.
2. Queries all report database records with eagerly-loaded detections, images, resolutions, assignments, supports, and forward histories.
3. Formats datetimes to remove timezone signatures for Excel compatibility.
4. Appends mapped report, location, YOLO, resolution, and forward history columns into a sequential dictionary structure.
5. Loads data into a Pandas DataFrame.
6. Streams file bytes back via `StreamingResponse` using CSV encoder or Openpyxl Excel writer.

### Success Response
* **HTTP Status:** `200 OK`
* **Media Type:** `text/csv` (for `format=csv`) or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (for `format=excel`).

### Example Headers (XLSX export)
```http
Content-Disposition: attachment; filename="ai_dataset.xlsx"
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

### Error Responses
| HTTP Status | Condition | Response / Detail |
| :---: | :--- | :--- |
| **401** | Missing/invalid token. | `{"detail": "Invalid or expired token."}` |
| **403** | Caller role is not Super Admin (e.g. City Admin). | `{"detail": "Only Super Admin can export AI dataset."}` |
| **422** | Invalid format query parameter (e.g. `json`). | `{"detail": [{"loc": ["query", "format"], "msg": "value is not a valid enumeration member", "type": "type_error.enum"}]}` |

---

## Admin / ML Integration Notes

* **JSON Data Processing:** The export streams files directly. If an admin requires raw JSON, they should fetch the CSV stream and serialize it using standard analytical tools (such as Python's Pandas `read_csv`).
* **Workflow Utility:** This endpoint is intended for offline analytical scripts rather than client-facing mobile or citizen web portals.
