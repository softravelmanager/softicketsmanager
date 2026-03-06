#!/bin/bash

# Usage: ./updb.sh <mongodb-uri> [1|2|3]
# Example: ./updb.sh "mongodb://localhost:27017/yourdbname" 1

MONGO_URI=$1
# Default to 'all' if the second argument is not provided
ACTION=$2

if [ -z "$MONGO_URI" ]; then
  echo "Usage: $0 <mongodb-uri> [im|ex|an]"
  exit 1
fi

run_import() {
  node importBackups.js "$MONGO_URI"
}

run_anonymize() {
  node anonymizeDb.js "$MONGO_URI"
}

run_export() {
  node exportBackups.js "$MONGO_URI"
}

case "$ACTION" in
  im)
    if [[ "$MONGO_URI" == *"y2d"* ]]; then
      echo "The provided URI appears to be a staging database. Aborting import operation for safety."
      exit 1
    fi
    run_import
    ;;
  ex)
    run_export
    ;;
  an)
    if [[ "$MONGO_URI" == *"y2d"* ]]; then
      echo "The provided URI appears to be a staging database. Aborting anonymize operation for safety."
      exit 1
    fi
    run_anonymize
    ;;
  *)
    echo "Invalid action: '$ACTION'. Please use 'im' to import, 'ex' to export, or 'an' to anonymize."
    exit 1
    ;;
esac
