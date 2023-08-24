// https://github.com/odoo/odoo/pull/87123/files
// pending promise, promise not rejected

// The code called 'action_demand' without specifying a failure method.
// In website, in the cases where 'action_demand' hook is not successful,
// it causes the spinner of the sidebar of the website builder to never stop.

// The fix adds the rejection of the promise, 
// Failure is propagated and thrown in console, as a result,
// the website builder bug does not prevent the user from continuing to work.

async function visibility(previewMode, widgetValue, params) {
    const show = (widgetValue !== 'hidden');
    await new Promise(resolve/*, reject */ => {
        this.trigger_up('action_demand', {
            actionName: 'toggle_page_option',
            params: [{name: this.pageOptionName, value: show}],
            onSuccess: () => resolve(),
            // onFailure: () => reject(), // ADDED IN FIX.
        });
    });
    this.trigger_up('snippet_option_visibility_update', {show: show});
}