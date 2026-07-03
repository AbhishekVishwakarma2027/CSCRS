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

                "class": names[cls_id],

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

                detection["mask"] = (
                    masks.xy[i].tolist()
                    if i < len(masks.xy)
                    else None
                )

            detections.append(detection)

        return detections