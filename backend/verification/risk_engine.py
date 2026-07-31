class RiskEngine:

    # Detector Weights
    WEIGHTS = {
        "exif": 0.70,
        "quality": 0.25,
        "duplicate": 0.05
    }

    PASS_THRESHOLD = 0.30
    REVIEW_THRESHOLD = 0.60

    def evaluate(self, detector_results):

        weighted_risk = 0.0
        flags = []

        for detector_name, result in detector_results.items():

            risk = result.get("risk_score", 0.0)
            weight = self.WEIGHTS.get(detector_name, 0.0)

            weighted_risk += risk * weight
            flags.extend(result.get("flags", []))

        weighted_risk = round(min(weighted_risk, 1.0), 2)

        flags = sorted(set(flags))

        ####################################################
        # Critical Rules (Highest Priority)
        ####################################################

        critical_flags = {
            "NO_EXIF",
            "NO_CAMERA",
            "NO_DATETIME"
        }

        critical_count = len(
            critical_flags.intersection(flags)
        )

        ####################################################
        # Decision Logic
        ####################################################

        if critical_count >= 2:

            decision = "REVIEW"

        elif weighted_risk < self.PASS_THRESHOLD:

            decision = "PASS"

        elif weighted_risk < self.REVIEW_THRESHOLD:

            decision = "REVIEW"

        else:

            decision = "REJECT"

        ####################################################
        # Final
        ####################################################

        return {

            "risk_score": weighted_risk,

            "decision": decision,

            "verification_passed": decision == "PASS",

            "manual_review": decision == "REVIEW",

            "flags": flags
        }