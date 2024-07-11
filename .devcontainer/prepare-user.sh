#!/usr/bin/env bash
set -eo pipefail

readonly USER=cweb-dev
readonly GROUP=$USER

main() {
  local -ri gid=$1
  local -ri uid=$2

  # Make sure that the given GID exists (name may be different from $GROUP).
  prepare_group "$gid"
  # Create or update the user to match given GID, UID and name.
  prepare_user "$gid" "$uid"
  exit 0
}

prepare_group() {
  local -ri gid=$1
  local -r group=$(getent group "$gid" | cut --delimiter=: --fields=1)

  # If group with the given GID doesn't exist.
  if [[ -z $group ]]; then
    # Keep the old $GROUP (if exists).
    groupmod --new-name "$GROUP-old" "$GROUP" 2>/dev/null || true
    groupadd --gid "$gid" "$GROUP"
  fi
}

prepare_user() {
  local -ri gid=$1
  local -ri uid=$2
  local -r user=$(id --name --user "$uid")

  # If user with the given UID doesn't exist.
  if [[ -z $user ]]; then
    # In case if the $USER username already exists.
    make_user_old "$USER"
    useradd --gid "$gid" --uid "$uid" --create-home "$USER"
  elif [[ $user != "$USER" ]]; then
    make_user_old "$USER"
    # Change primary group and rename the user.
    usermod --gid "$gid" --login "$USER" "$user"
  else
    usermod --gid "$gid" "$user" 2>/dev/null || true
  fi
}

make_user_old() {
  local -r user=$1
  usermod \
      --login "$user-old" \
      --home "/home/$user-old" \
      --move-home \
      "$user" 2>/dev/null || true
}

main "$@"
