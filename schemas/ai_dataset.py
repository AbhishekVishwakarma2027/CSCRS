from enum import Enum


class DatasetExportFormat(str, Enum):
    CSV = "csv"
    EXCEL = "excel"