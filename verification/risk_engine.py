class RiskEngine:

    # Detector Weights
    WEIGHTS = {

        "exif": 0.30,

        "quality": 0.20,

        "ai_generated": 0.30,

        "duplicate": 0.20
    }

    # Decision Thresholds
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

        if weighted_risk < self.PASS_THRESHOLD:

            decision = "PASS"

        elif weighted_risk < self.REVIEW_THRESHOLD:

            decision = "REVIEW"

        else:

            decision = "REJECT"

        return {

            "risk_score": weighted_risk,

            "decision": decision,

            "verification_passed": decision != "REJECT",

            "flags": sorted(set(flags))
        }