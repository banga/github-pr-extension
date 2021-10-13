const INLINE_COMMENT_CLASS = "review-comment";
const INLINE_COMMENT_SELECTOR = `#files tr.inline-comments .js-comments-holder > .${INLINE_COMMENT_CLASS}`;
const GLOBAL_COMMENT_CLASS = "timeline-comment";
const GLOBAL_COMMENT_SELECTOR = `#comments .${GLOBAL_COMMENT_CLASS}`;
const COMMENT_FOCUSED_CLASS = "focused-by-extension";
const LIKE_BUTTON_SELECTOR = "button[data-reaction-label='+1']";
const GLOBAL_REPLY_SELECTOR = "#all_commit_comments .timeline-new-comment button.write-tab";
const INLINE_REPLY_SELECTOR = ".review-thread-reply-button";

function query(selector) {
    return document.querySelectorAll(selector);
}

function getAll() {
    return query(`${INLINE_COMMENT_SELECTOR},${GLOBAL_COMMENT_SELECTOR}`);
}

function getFocused() {
    return query(`.${COMMENT_FOCUSED_CLASS}`);
}

function getFocusedIndex(elems) {
    for (var i = 0; i < elems.length; i++) {
        if (elems[i].classList.contains(COMMENT_FOCUSED_CLASS)) {
            return i;
        }
    }
    return -1;
}

function focusNext() {
    const all = getAll();
    if (!all) {
        return;
    }
    const focusedIndex = getFocusedIndex(all);
    if (focusedIndex < all.length - 1) {
        focus(all[focusedIndex + 1]);
    }
}

function focusPrevious() {
    const all = getAll();
    if (!all) {
        return;
    }
    const focusedIndex = getFocusedIndex(all);
    if (focusedIndex > 0) {
        focus(all[focusedIndex - 1]);
    } else {
        focus(all[0]);
    }
}

function toggleLike() {
    query(`.${COMMENT_FOCUSED_CLASS} ${LIKE_BUTTON_SELECTOR}`)
        .forEach(comment => comment.click());
}

function startReply() {
    const focused = getFocused();
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

function focus(elem) {
    getFocused().forEach(
        comment => comment.classList.remove(COMMENT_FOCUSED_CLASS));
    elem.classList.add(COMMENT_FOCUSED_CLASS);
    elem.scrollIntoViewIfNeeded();
}

window.addEventListener("keydown", function(e) {
    if (e.altKey || e.shiftKey || e.ctrlKey || e.metaKey ||
        e.target.nodeName == "TEXTAREA" || e.target.nodeName == "INPUT" ||
        e.target.getAttribute("contentEditable") === "true") {
        return;
    }
    switch (e.key) {
        case "j":
            focusNext();
            break;
        case "k":
            focusPrevious();
            break;
        case "l":
            toggleLike();
            break;
        case "r":
            startReply();
            e.preventDefault();
            break;
    }
});
