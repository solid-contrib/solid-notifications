'use strict'

const DEFAULT_CONTENT_TYPE = 'application/ld+json'
const INBOX_LINK_REL = 'http://www.w3.org/ns/ldp#inbox'

/**
 * @param uri {string} Resource uri
 * @param webClient {SolidWebClient}
 * @param [resource] {SolidResponse} Optional resource (passed in if you already
 *   have requested the resource and have it handy). Saves making a GET request.
 * @throws {Error} Rejects with an error if the resource has no inbox uri.
 * @return {Promise<string>} Resolves to the inbox uri for the given resource
 */
export function discoverInboxUri (uri, webClient, resource) {
  return Promise.resolve()
    .then(() => {
      if (resource) {
        return resource
      } else {
        return webClient.get(uri)
      }
    })
    .then(resource => {
      // First check the headers for an inbox link rel
      let inboxLinkRel = resource.linkHeaders[INBOX_LINK_REL]
      if (inboxLinkRel) {
        return inboxLinkRel
      }
      // If not found, parse the body, look for an ldp:inbox predicate
      let rdf = webClient.rdf
      let body = resource.parsedGraph()
      let matches = body.match(null, rdf.namedNode(INBOX_LINK_REL))
      if (matches.length) {
        return matches[0].object.value
      } else {
        return Promise.reject(new Error('No inbox uri found for resource.'))
      }
    })
}

/**
 * Sends a notification to a given resource's LDN inbox. If no inbox uri is
 * provided in the options, also performs LDN Inbox discovery.
 * @see https://www.w3.org/TR/ldn/#discovery
 * @see https://www.w3.org/TR/ldn/#sending
 * @method send
 * @param resourceUri {string} Location of the resource that has an inbox
 * @param payload {string} Notification body (serialized rdf)
 * @param options {Object} Options hashmap
 * @param options.webClient {SolidWebClient}
 * @param [options.inboxUri] {string} If the resource's Inbox uri is already
 *   known, pass it in. Otherwise, it will be discovered via a GET request.
 * @param [options.contentType] {string} Content type of the notification
 *   payload. Defaults to the default LDN content type ('application/ld+json').
 * @return {Promise<SolidResponse>}
 */
export function send (resourceUri, payload, options) {
  let webClient = options.webClient
  if (!webClient) {
    return Promise.reject(new Error('Web client instance is required'))
  }
  return Promise.resolve()
    .then(() => {
      if (options.inboxUri) {
        return options.inboxUri
      } else {
        return discoverInboxUri(resourceUri, webClient)
      }
    })
    .then(inboxUri => {
      let contentType = options.contentType || DEFAULT_CONTENT_TYPE
      let postOptions = {
        headers: {
          'Content-Type': contentType
        }
      }
      return webClient.solidRequest(inboxUri, 'POST', postOptions, payload)
    })
}
