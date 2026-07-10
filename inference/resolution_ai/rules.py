class ResolutionRuleEngine:

    FAIL_SIMILARITY_THRESHOLD = 0.40
    REVIEW_SIMILARITY_THRESHOLD = 0.70

    def evaluate(

        self,

        verification_passed,

        scene_similarity,

        yolo_issue_found,

    ):

        if not verification_passed:

            return "FAIL"

        if scene_similarity < self.FAIL_SIMILARITY_THRESHOLD:

            return "FAIL"
        
        if scene_similarity < self.REVIEW_SIMILARITY_THRESHOLD:
            return "REVIEW"

        if yolo_issue_found:

            return "FAIL"

        return "PASS"