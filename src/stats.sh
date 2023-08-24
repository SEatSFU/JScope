#!/bin/bash
# Script to count warns in a log output.

######
#
# HOW TO USE: Copy the bash script below and run it when at the root of this project.
# it will run for all projects with their log files in ./logs/ 
# and calculate the stats in the script below.
# NOTICE: COPY BELOW.
# ls logs | grep ".log" | grep --invert -e "\-before" -e "\.before" -e "\.after" -e "\-after" | while read -r logfile; do node ./out/cli.js logs/"$logfile" | ./src/stats.sh; done
# NOTICE: COPY ABOVE.
#
# Script breakdown:
#
# # get the log files not containing before or after.
# ls logs | grep ".log" | grep --invert -e "\-before" -e "\.before" -e "\.after" -e "\-after" \
# 
# read then one by one, run cli.js for them and pipe it into the stats.sh 
# | while read -r logfile; do node ./out/cli.js logs/"$logfile" | ./src/stats.sh; done
#
######

cat > /tmp/out.log

head -n1 /tmp/out.log | rev | cut -d'/' -f1 | rev | sed -e "s/.log$//" | tr '\n' ","
grep -c "Promise never \`fulfilled\`." /tmp/out.log | tr '\n' ", "
grep -c "Promise never \`rejected\`." /tmp/out.log | tr '\n' ", "
grep -c "No \`fulfill\` reaction registered." /tmp/out.log | tr '\n' ", "
grep -c "No \`reject\` reaction registered." /tmp/out.log | tr '\n' ", "
grep -c "No \`fulfill\` reaction executed." /tmp/out.log | tr '\n' ", "
grep -c "No \`reject\` reaction executed." /tmp/out.log