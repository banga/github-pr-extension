const INLINE_COMMENT_CLASS = 'review-comment';
const INLINE_COMMENT_SELECTOR = `#files tr.inline-comments .js-comments-holder > .${INLINE_COMMENT_CLASS}`;
const GLOBAL_COMMENT_CLASS = 'timeline-comment';
const GLOBAL_COMMENT_SELECTOR = `#comments .${GLOBAL_COMMENT_CLASS}`;
const ALL_COMMENTS_SELECTOR = `${INLINE_COMMENT_SELECTOR},${GLOBAL_COMMENT_SELECTOR}`;
const FOCUSED_CLASS = 'focused-by-extension';
const LIKE_BUTTON_SELECTOR = "button[data-reaction-label='+1']";
const GLOBAL_REPLY_SELECTOR = '#all_commit_comments .timeline-new-comment button.write-tab';
const INLINE_REPLY_SELECTOR = '.review-thread-reply-button';
const ADD_LINE_COMMENT_BUTTON_SELECTOR =
    '.blob-code-addition > .add-line-comment, .blob-code-deletion > .add-line-comment';

/** @return {Array<Element>}  */
function query(selector) {
    return Array.from(document.querySelectorAll(selector));
}

/* Focus */

function focusElement(elem) {
    getFocusedElement().forEach((comment) => comment.classList.remove(FOCUSED_CLASS));
    elem.classList.add(FOCUSED_CLASS);
    elem.focus();
    elem.scrollIntoViewIfNeeded();
}

function getFocusedElement() {
    return query(`.${FOCUSED_CLASS}`);
}

/** @param {Array<Element>} elems  */
function getFocusedIndex(elems) {
    return elems.findIndex((elem) => elem.classList.contains(FOCUSED_CLASS));
}

function focusNext(items) {
    const focusedIndex = getFocusedIndex(items);
    if (focusedIndex < items.length - 1) {
        focusElement(items[focusedIndex + 1]);
    }
}

function focusPrevious(items) {
    const focusedIndex = getFocusedIndex(items);
    if (focusedIndex > 0) {
        focusElement(items[focusedIndex - 1]);
    } else {
        focusElement(items[0]);
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
    query(`.${FOCUSED_CLASS} ${LIKE_BUTTON_SELECTOR}`).forEach((comment) => comment.click());
}

function startReply() {
    const focused = getFocusedElement();
    if (!focused.length) {
        return;
    }
    const comment = focused[0];
    if (comment.classList.contains(INLINE_COMMENT_CLASS)) {
        comment.parentElement.parentElement.querySelector(INLINE_REPLY_SELECTOR).click();
    } else {
        document.querySelector(GLOBAL_REPLY_SELECTOR).click();
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
    }
});
