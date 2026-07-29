# 08 - Pagination, Filtering, and Sorting

To optimize performance and minimize payload transfer overhead, the CSCRS API restricts collection routes using query-based limits, search patterns, and filtering scopes.

## 1. Report Pagination (`GET /api/v1/reports`)
The endpoint returning citywide civic reports enforces structured pagination.
* **Pagination Control Parameters:**
  * `page` (Query, Integer): The target page index. Default is `1`. Must be at least `1`.
  * `page_size` (Query, Integer): The number of records returned per page. Default is `20`. Must be between `1` and `100` (enforced by `MAX_PAGE_SIZE_LIMIT` config).
* **Validation Bounds:** Providing a `page` less than 1, or a `page_size` outside the `1-100` boundary returns an HTTP `400 Bad Request` validation exception.
* **Pagination Metadata Envelope:** Paginated results are wrapped in a JSON structure containing the item list and traversal boolean properties:
  ```json
  {
    "items": [
      {
        "id": 1,
        "report_number": "CSCRS-20260728-9F3A4B2C",
        "description": "Streetlight failure...",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "status": "Pending",
        "priority": "Medium",
        "issue_type": "Street Light"
      }
    ],
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_items": 124,
      "total_pages": 7,
      "has_next": true,
      "has_previous": false
    }
  }
  ```

---

## 2. Report Filtering & Search Queries
Clients can filter report lists using query string filters. These parameter keys map to specific properties in the report table:

### Pagination Filtering (`GET /api/v1/reports` & `GET /api/v1/reports/department`)
* `department_id` (Query, Integer): Restricts results to reports belonging to a specific department. (Available to CityAdmin/SuperAdmin; DepartmentAdmin is restricted by their own session ID).
* `status` (Query, String): Restricts reports to a specific status value (`Pending`, `Assigned`, `In Progress`, etc.).
* `priority` (Query, String): Filters by priority level (`Low`, `Medium`, `High`, `Critical`).
* `issue_type` (Query, String): Filters reports matching the exact issue type string.

### Text-Based Search (`GET /api/v1/reports/search` & `/reports/my/search`)
* `query` (Query, String): Submits a search string. The database CRUD query layer searches for partial matches using SQL `ILIKE` operators against:
  * `report_number`
  * `issue_type`
  * `address` (where applicable)

---

## 3. System Issue Filtering & Search (`GET /api/v1/issues`)
The administrative issue log endpoint supports filtering tickets using the following query parameters:
* `status` (Query, String): Filter system tickets by issue status (`OPEN`, `IN_REVIEW`, `RESOLVED`, `REJECTED`).
* `category` (Query, String): Filter by category enum string (e.g., `Authentication`, `Database`).
* `reporter` (Query, String): Filters system issues reported by a specific user email.
* `search` (Query, String): Submits a text string. The CRUD layer performs partial `ILIKE` matches against:
  * `title`
  * `description`
  * `issue_number`

---

## 4. Sorting Specification
* **No Global Client-Controlled Sorting:** CSCRS does not implement client-controlled sorting parameters (such as `sort`, `order`, or `order_by`).
* **Default Database Ordering:** If not modified by filters, queries default to database insertion sequence or creation timestamp sorting. Do not attempt to pass sorting parameters to query strings as they are not supported in the database CRUD query signatures.
