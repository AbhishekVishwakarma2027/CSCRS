from database.enums import Priority


class PriorityEngine:
    """
    Priority Engine V1

    Current Factors
    ---------------
    - AI Risk Score
    - Citizen Support Count

    Future Factors
    --------------
    - Road Category
    - Nearby Hospital
    - Nearby School
    - Traffic Density
    - Weather
    - Manual Escalation
    """

    @staticmethod
    def calculate(
        *,
        risk_score: float,
        support_count: int,
    ) -> Priority:

        score = 0

        # --------------------------
        # AI Risk Score
        # --------------------------

        if risk_score >= 0.80:
            score += 60

        elif risk_score >= 0.60:
            score += 45

        elif risk_score >= 0.40:
            score += 30

        else:
            score += 15

        # --------------------------
        # Citizen Supports
        # --------------------------

        if support_count >= 50:
            score += 40

        elif support_count >= 25:
            score += 30

        elif support_count >= 10:
            score += 20

        elif support_count >= 5:
            score += 10

        # --------------------------
        # Final Priority
        # --------------------------

        if score >= 90:
            return Priority.CRITICAL

        if score >= 60:
            return Priority.HIGH

        if score >= 35:
            return Priority.MEDIUM

        return Priority.LOW