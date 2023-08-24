#!/bin/bash

IFS=$'\n'
for line in $(cat projects-list-mocha.txt); do
    echo "$line"
    splitted=$(echo "$line" | cut -d, -f1)
    repo="${splitted[0]}"
    echo "$repo"
    gh api search/code --method=GET -F "q=promise+language:js+repo:${repo}" --jq '.items[].html_url'
    # gh api search/issues --method=GET -F "q=fix%20is:issue%20repo:${repo}%20is:closed" # --jq '.items[].html_url'
    gh search issues "fix (await OR promise OR async OR exception)" --include-prs --repo="${repo}" --state=closed
    # gh search issues "fix async" --include-prs --repo="${repo}" --state=closed
    # gh search issues "bug async" --include-prs --repo="${repo}" --state=closed
    # gh search issues "fix await" --include-prs --repo="${repo}" --state=closed
    # gh search issues "bug await" --include-prs --repo="${repo}" --state=closed
    # gh search issues "fix exception" --repo="${repo}" --state=closed
    # gh search issues "bug exception" --repo="${repo}" --state=closed
    read -n1 -p "store ${repo}? [y,n]" response 
    case $response in  
    y|Y) echo "${repo}" >> "selected-projects.txt" ;; 
    *) echo no ;; 
    esac
    echo -e "\n\n\n\n"
    # sleep 4
done

