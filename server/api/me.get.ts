export default defineEventHandler(async event => loadMe(event, await requireUserId(event)))
