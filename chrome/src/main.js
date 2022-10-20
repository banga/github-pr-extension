const INLINE_COMMENT_CLASS = 'review-comment';
const INLINE_COMMENT_SELECTOR = `#files tr.inline-comments .js-comments-holder > .${INLINE_COMMENT_CLASS}`;
const GLOBAL_COMMENT_CLASS = 'timeline-comment';
const GLOBAL_COMMENT_SELECTOR = `#comments .${GLOBAL_COMMENT_CLASS}`;
const ALL_COMMENTS_SELECTOR = `${INLINE_COMMENT_SELECTOR},${GLOBAL_COMMENT_SELECTOR}`;
const FOCUSED_CLASS = 'focused-by-extension';
const REACTION_DROPDOWN_CLASS = 'reaction-dropdown-button';
const LIKE_BUTTON_SELECTOR = "button[data-reaction-label='+1']";
const GLOBAL_REPLY_SELECTOR = '#all_commit_comments .timeline-new-comment button.write-tab';
const INLINE_REPLY_SELECTOR = '.review-thread-reply-button';
const ADD_LINE_COMMENT_BUTTON_SELECTOR =
    '.blob-code-addition > .add-line-comment, .blob-code-deletion > .add-line-comment';

/**
 * @param {Element} element
 * @returns {boolean}
 */
function isVisible(element) {
    return element.offsetWidth || element.offsetHeight || element.getClientRects().length;
}

/** @return {Array<Element>}  */
function query(selector) {
    return Array.from(document.querySelectorAll(selector)).filter(isVisible);
}

/* Focus */

/** @returns {Array<Element>} */
function getAllFocusedElements() {
    return query(`.${FOCUSED_CLASS}`);
}

/** @returns {Element | undefined} */
function getFocusedElement() {
    return getAllFocusedElements()[0];
}

function focusElement(elem) {
    getAllFocusedElements().forEach((comment) => comment.classList.remove(FOCUSED_CLASS));
    elem.classList.add(FOCUSED_CLASS);
    elem.focus();
    elem.scrollIntoViewIfNeeded();
}

/** @returns {Element | null} */
function getFirstElementAfterFocused(items) {
    const focusedElement = getFocusedElement();
    for (const item of items) {
        if (
            !focusedElement ||
            focusedElement.compareDocumentPosition(item) & Node.DOCUMENT_POSITION_FOLLOWING
        ) {
            return item;
        }
    }
    return null;
}

/** @returns {Element | null} */
function getLastElementBeforeFocused(items) {
    const focusedElement = getFocusedElement();
    items.reverse();
    for (const item of items) {
        if (
            !focusedElement ||
            focusedElement.compareDocumentPosition(item) & Node.DOCUMENT_POSITION_PRECEDING
        ) {
            return item;
        }
    }
    return null;
}

/** @param {Array<Element>} items */
function focusNext(items) {
    const nextElement = getFirstElementAfterFocused(items);
    if (nextElement) {
        focusElement(nextElement);
    }
}

/** @param {Array<Element>} items */
function focusPrevious(items) {
    const prevElement = getLastElementBeforeFocused(items);
    if (prevElement) {
        focusElement(prevElement);
    }
}

/* Comments */

function getAllComments() {
    return query(ALL_COMMENTS_SELECTOR);
}

function focusNextComment() {
    focusNext(getAllComments());
}

function focusPreviousComment() {
    focusPrevious(getAllComments());
}

/* Changes */

function getParentRowForAddCommentButton(element) {
    return element.parentElement.parentElement;
}

function getCommentButtonsAtChangeBoundaries() {
    const elements = query(ADD_LINE_COMMENT_BUTTON_SELECTOR);
    if (elements.length === 0) {
        return [];
    }

    // Filter out buttons in rows that are not at the end of a contiguous change
    const filteredElements = [];
    let currentElement = elements[0];
    for (const nextElement of elements.slice(1)) {
        if (
            getParentRowForAddCommentButton(currentElement) !==
                getParentRowForAddCommentButton(nextElement) &&
            getParentRowForAddCommentButton(currentElement).nextElementSibling !==
                getParentRowForAddCommentButton(nextElement)
        ) {
            filteredElements.push(currentElement);
        }
        currentElement = nextElement;
    }
    filteredElements.push(currentElement);

    return filteredElements;
}

function focusNextChange() {
    focusNext(getCommentButtonsAtChangeBoundaries());
}

function focusPreviousChange() {
    focusPrevious(getCommentButtonsAtChangeBoundaries());
}

/* Actions */

function toggleLike() {
    document.querySelector(`.${FOCUSED_CLASS} .${REACTION_DROPDOWN_CLASS}`).click();
    query(`.${FOCUSED_CLASS} ${LIKE_BUTTON_SELECTOR}`).forEach((comment) => comment.click());
}

function startReply() {
    const comment = getFocusedElement();
    if (!comment) {
        return;
    }
    if (comment.classList.contains(INLINE_COMMENT_CLASS)) {
        comment.parentElement.parentElement.querySelector(INLINE_REPLY_SELECTOR).click();
    } else {
        document.querySelector(GLOBAL_REPLY_SELECTOR).click();
    }
}

function openInEditor() {
    let element = getFocusedElement();
    if (!element) {
        return;
    }
    if (!element.hasAttribute('data-path')) {
        element = getLastElementBeforeFocused(getCommentButtonsAtChangeBoundaries());
    }
    const path = element.getAttribute('data-path');
    const line = element.getAttribute('data-line');
    if (path) {
        chrome.storage.sync.get('editorUrl', function ({editorUrl}) {
            const url = editorUrl.replace(`{path}`, path).replace('{line}', line);
            window.open(url);
        });
    }
}

window.addEventListener('keydown', function (e) {
    if (
        e.altKey ||
        e.shiftKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.target.nodeName == 'TEXTAREA' ||
        e.target.nodeName == 'INPUT' ||
        e.target.getAttribute('contentEditable') === 'true'
    ) {
        return;
    }
    switch (e.key) {
        case 'j':
            focusNextChange();
            break;
        case 'k':
            focusPreviousChange();
            break;
        case 'n':
            focusNextComment();
            break;
        case 'p':
            focusPreviousComment();
            break;
        case 'l':
            toggleLike();
            break;
        case 'r':
            startReply();
            e.preventDefault();
            break;
        case '\\':
            openInEditor();
            break;
    }
});

// Automate the daily clickthrough to hit SSO.
window.addEventListener('load', function (e) {
    const ssoButton = document.querySelector(".org-sso button[type='submit']");
    if (ssoButton) {
        ssoButton.click();
    }
});
