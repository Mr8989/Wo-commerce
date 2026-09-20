#!/bin/bash
# Sends an email alert when a systemd service fails.
# Triggered automatically via OnFailure= in gunicorn.service (see croppedbyayerkie-alert.service).
# Dependency-free on purpose (just bash + curl) so it still works if the app's venv is broken.

# Prefer the Node backend's .env, falling back to the old Django one.
ENV_FILE="/var/www/croppedbyayerkie/backend-node/.env"
[ -f "$ENV_FILE" ] || ENV_FILE="/var/www/croppedbyayerkie/backend/.env"
SERVICE="${1:-croppedbyayerkie}"

get_var() {
    grep -E "^$1=" "$ENV_FILE" | tail -1 | cut -d '=' -f2- | tr -d '"' | xargs
}

FROM=$(get_var EMAIL_HOST_USER)
PASSWORD=$(get_var EMAIL_HOST_PASSWORD)
TO=$(get_var ADMIN_EMAIL)

if [ -z "$FROM" ] || [ -z "$PASSWORD" ] || [ -z "$TO" ]; then
    logger "croppedbyayerkie-alert: missing email config in $ENV_FILE, cannot send crash alert"
    exit 1
fi

STATUS=$(systemctl status "$SERVICE" --no-pager -l | head -20)

curl --silent --url 'smtps://smtp.gmail.com:465' \
    --mail-from "$FROM" \
    --mail-rcpt "$TO" \
    --user "$FROM:$PASSWORD" \
    -T <(printf "Subject: [ALERT] %s crashed on croppedbyayerkie.com\nFrom: %s\nTo: %s\n\nService: %s\nTime: %s\n\n%s\n" \
        "$SERVICE" "$FROM" "$TO" "$SERVICE" "$(date)" "$STATUS")
