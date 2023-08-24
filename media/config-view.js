//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    // @ts-ignore
    const vscode = acquireVsCodeApi();
    // const vscode = {getState: () => true};

    const oldState = vscode.getState() || { colors: [] };

    // document.querySelector('.clear-tree').addEventListener('click', () => {
    //     vscode.postMessage({ type: 'clearTree', value: {} });
    // });

    document.querySelector('.start').addEventListener('click', () => {
        vscode.postMessage({ type: 'startAnalysis', value: {} });
    });
    // document.querySelector('.annotate').addEventListener('click', () => {
    //     vscode.postMessage({ type: 'annotate', value: {} });
    // });

    // function _updateSearchQuery() {
    //     vscode.postMessage({ type: 'updateSearchQuery', value: this.value });
    // }
    // document.querySelector('#search').addEventListener('input', _updateSearchQuery)
    // document.querySelector('#search').addEventListener('propertychange', _updateSearchQuery)


    document.querySelectorAll("input[name='coverageType']").forEach(item => {
        item.addEventListener('change', function(e) {
            // @ts-ignore
            vscode.postMessage({ type: 'updateCoverageType', value: e.target.value });
        })
    })

    document.querySelectorAll("input[name='promiseType']").forEach(item => {
        item.addEventListener('change', function(e) {
            // @ts-ignore
            let allChecked = [...document.querySelectorAll("input[name='promiseType']:checked")].map(e => e.value.split(',')).flat()
            vscode.postMessage({ type: 'updatePromiseTypes', value: allChecked });
        })
    })
    

    

    // For show/hide...
    document.querySelector("#all").addEventListener('change', (e) => {
        // @ts-ignore
        if(!e.target.checked) {
            document.querySelectorAll(".promise-type-other").forEach(item => {
                item.className = "promise-type-other"
            })
        } else {
            document.querySelectorAll(".promise-type-other").forEach(item => {
                item.className = "promise-type-other hidden"
            })
        }
    })
    
    
    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'addColor':
                {
                    break;
                }
            case 'clearColors':
                {
                    break;
                }

        }
    });
}());


