from user_agents import parse

from fastapi import Request


class SecurityService:

    @staticmethod
    def get_client_ip(
        request: Request,
    ) -> str | None:

        forwarded_for = request.headers.get(
            "X-Forwarded-For"
        )

        if forwarded_for:

            return (
                forwarded_for
                .split(",")[0]
                .strip()
            )

        real_ip = request.headers.get(
            "X-Real-IP"
        )

        if real_ip:

            return real_ip

        if request.client:

            return request.client.host

        return None

    @staticmethod
    def get_device_info(
        request: Request,
    ) -> dict:

        user_agent = request.headers.get(
            "User-Agent",
            "",
        )

        ua = parse(user_agent)

        return {
            "user_agent": user_agent,
            "browser": ua.browser.family,
            "browser_version": ".".join(
                map(
                    str,
                    ua.browser.version,
                )
            ),
            "operating_system": ua.os.family,
            "os_version": ".".join(
                map(
                    str,
                    ua.os.version,
                )
            ),
            "device_type": (
                "Mobile"
                if ua.is_mobile
                else (
                    "Tablet"
                    if ua.is_tablet
                    else (
                        "PC"
                        if ua.is_pc
                        else (
                            "Bot"
                            if ua.is_bot
                            else "Other"
                        )
                    )
                )
            ),
            "platform": ua.device.family,
        }