from inference.geometry import Geometry
class ResultParser:


    @staticmethod
    def parse(result, include_masks=False):

        detections = []

        if result.boxes is None:
            return detections

        names = result.names

        boxes = result.boxes

        masks = result.masks

        for i in range(len(boxes)):

            box = boxes[i]

            cls_id = int(box.cls.item())

            detection = {

                "class_name": names[cls_id],

                "confidence": round(
                    float(box.conf.item())*100,
                    2
                ),

                "bbox": [
                    round(float(x), 2)
                    for x in box.xyxy[0].tolist()
                ]
            }

            if include_masks and masks is not None:

                polygon = (
                    masks.xy[i].tolist()
                    if i < len(masks.xy)
                    else None
                )

                detection["polygon"] = polygon

                detection["mask_area"] = (
                    round(
                        Geometry.polygon_area(
                            polygon,
                        ),
                        2,
                    )
                    if polygon
                    else 0
                )

            detections.append(detection)

        return detections