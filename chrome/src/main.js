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
    '.blob-code-addition:has(.add-line-comment), .blob-code-deletion:has(.add-line-comment)';
const SSO_BUTTON_SELECTOR = '.org-sso button[type="submit"]';
const LOAD_DIFF_BUTTON_SELECTOR = 'button.load-diff-button';

/**
 * @param {HTMLElement} element
 * @returns {boolean}
 */
function isVisible(element) {
    return element.offsetWidth || element.offsetHeight || element.getClientRects().length;
}

/** @param {HTMLElement} element */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
    );
}

/** @return {Array<HTMLElement>}  */
function query(selector) {
    return Array.from(document.querySelectorAll(selector)).filter(isVisible);
}

/* Focus */

/** @returns {Array<HTMLElement>} */
function getAllFocusedElements() {
    return query(`.${FOCUSED_CLASS}`);
}

/** @returns {HTMLElement | undefined} */
function getFocusedElement() {
    return getAllFocusedElements()[0];
}

/** @param {HTMLElement} elem */
function focusElement(elem) {
    getAllFocusedElements().forEach((comment) => comment.classList.remove(FOCUSED_CLASS));
    elem.classList.add(FOCUSED_CLASS);
    elem.focus();
    elem.scrollIntoViewIfNeeded();
}

/** @returns {HTMLElement | null} */
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

/** @returns {HTMLElement | null} */
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

/** @param {Array<HTMLElement>} items */
function focusNext(items) {
    const nextElement = getFirstElementAfterFocused(items);
    if (nextElement) {
        focusElement(nextElement);
    }
}

/** @param {Array<HTMLElement>} items */
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

function getAllCommentButtons() {
    return query(ADD_LINE_COMMENT_BUTTON_SELECTOR);
}

function focusNextChange() {
    focusNext(getAllCommentButtons());
}

function focusPreviousChange() {
    focusPrevious(getAllCommentButtons());
}

function focusNextPage() {
    focusNext(getAllCommentButtons().filter((elem) => !isInViewport(elem)));
}

function focusPreviousPage() {
    focusPrevious(getAllCommentButtons().filter((elem) => !isInViewport(elem)));
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
    // The data-path and data-line are on the button inside the cell
    const button = element.querySelector('.add-line-comment') || element;
    const repo = window.location.pathname.split('/')[2];
    const {path, line} = button.dataset;
    if (path) {
        chrome.storage.sync.get('editorUrl').then(({editorUrl}) => {
            if (editorUrl) {
                const url = editorUrl
                    .replace('{repo}', repo)
                    .replace('{path}', path)
                    .replace('{line}', line);
                window.open(url, '_blank', 'noopener');
            }
        });
    }
}

window.addEventListener('keydown', function (e) {
    if (
        e.altKey ||
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
        case 'J':
            focusNextPage();
            break;
        case 'K':
            focusPreviousPage();
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

function clickSsoButton() {
    // Automate the daily clickthrough to hit SSO.
    const ssoButton = document.querySelector(SSO_BUTTON_SELECTOR);
    if (ssoButton) {
        ssoButton.click();
    }
}

function clickLoadDiffButtons() {
    const loadDiffButtons = query(LOAD_DIFF_BUTTON_SELECTOR);
    for (const button of loadDiffButtons) {
        button.click();
    }
}

window.addEventListener('load', function (e) {
    clickSsoButton();
    clickLoadDiffButtons();

    // Handle when content is loaded later via
    // https://github.com/github/include-fragment-element
    const loaders = query('include-fragment');
    for (const loader of loaders) {
        loader.addEventListener('load', clickLoadDiffButtons);
    }
});
