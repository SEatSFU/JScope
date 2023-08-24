// PR here: https://github.com/cla-assistant/cla-assistant/pull/854/files
// promise not awaited, unhandled resolve (although detected as unhandled reject in PR)

// SUMMARY OF ISSUE:
// A bug where the removal of webhooks caused an unhandled rejected promise,
// if they got already manually removed (or some other problem). 
// Problem was that while we had a try/catch in place to handle this case, 
// we failed to await the promise causing it be 
// an unhandled rejected promise outside of a try/catch.
// * In Node16 a unhandled promise causes the node process to exit and a hard shutdown.

const Webhook = {
    // other methods.
    remove: async (req) => {
        utils.validateArgs(req.args, REPOREMOVESCHEMA)
        const dbRepo = await repo.remove(req.args)
        if (dbRepo && dbRepo.gist) {
             req.args.owner = dbRepo.owner
             req.args.repo = dbRepo.repo
             try {
                 webhook.remove(req) // FIX: add await before this.
                 // in our case, this promise is rejected later after completion of `remove`
                 // function since there is no awaiting for the promise, 
                 // causing the program to throw unhandled rejection and shut down.
             } catch (error) {
                 logger.error(`Could not remove the webhook for the repo ${new Error(error)}`)
             }
        }
        return dbRepo
    }
}
