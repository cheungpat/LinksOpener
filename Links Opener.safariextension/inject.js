/*
 * Copyright (c) 2010 Kwok-kuen Cheung.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. The name of the author may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE AUTHOR ``AS IS'' AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
 * IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT
 * NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

document.addEventListener("contextmenu", handleContextMenu, false);

function getUrlsFromSelection() {
    var selection = document.getSelection().rangeCount > 0 ?
        document.getSelection().getRangeAt(0) : null;

    if (selection == null) return [];

    if (selection.startContianer == selection.endContainer && selection.startOffset == selection.endOffset) return [];

    var urls = [];

    var startElement = selection.startContainer;
    var endElement = selection.endContainer;
    var commonElement = selection.commonAncestorContainer;

    // The starting point of selection may start after the last child of
    // the start element. In this case, we find the next sibling / sibling of
    // parent
    if (startElement.length <= selection.startOffset) {
        while (startElement != null && startElement.nextSibling == null) {
            startElement = startElement.parentNode;
        }
        if (startElement == null) {
            // this is not likely
            return [];
        }
        startElement = startElement.nextSibling;
    }

    if (startElement == null || endElement == null || commonElement == null) return [];

    var thisNode = null;
    var nodeStack = [startElement];
    var lastParent = startElement;

    // 1st phase find <a> in the common parent of the start and end elements,
    // and then the parent of this parent
    thisNode = commonElement ? commonElement.parentNode : null;
    while (thisNode) {
        if (thisNode.nodeName == "A") {
            var url = String(thisNode['href']);
            if (isGoodUrl(url) && urls.indexOf(url) == -1) {
                urls.unshift(url);
            }
        }
        thisNode = thisNode.parentNode;
    }
    thisNode = null;

    // 2nd phase, find <a> between starting element and ending element in DOM
    while(thisNode != endElement) {
        if (nodeStack.length == 0) {
            nodeStack.push(lastParent.parentNode);
            continue;
        } else {
            thisNode = nodeStack.pop();
        }

        if (thisNode.nodeName == "A") {
            var url = String(thisNode['href']);
            if (isGoodUrl(url) && urls.indexOf(url) == -1) {
                urls.push(url);
            }
        }

        // if there are children, drill down
        if (thisNode.childNodes.length > 0) {
            for (var i=thisNode.childNodes.length - 1; i >= 0; i--) {
                if (thisNode.childNodes[i] != lastParent) {
                    nodeStack.push(thisNode.childNodes[i]);
                } else {
                    // if this child is equal to lastParent, that means this
                    // children is already parsed. thisNode becomes the new
                    // parent.
                    lastParent = thisNode;
                    break;
                }
            }
        }
    }

    return urls;
}

function isGoodUrl(url) {
    url = url != null ? url.toString().trim() : null;
    return url != null && url != ""
        && url.indexOf("javascript:") !== 0
        && url.indexOf("email:") !== 0;
}

function handleContextMenu(event) {
    // tell global script whether there is a selection
    safari.self.tab.setContextMenuEventUserInfo(event, {
        'links': getUrlsFromSelection()
    });
}
