/**
 * UI feedback helper.
 */
export default class Feedback {
    /**
     * Displays a temporary feedback message in the UI.
     * @param {string} message - The message to display.
     * @param {HTMLElement} targetElement - The HTML element where the message will be added.
     * @param {boolean} isSuccess - Determines if the message is a success or error.
     * @param {string} mode - Determines how the message is handled ('create' or 'set').
     */
    static show(message, targetElement, isSuccess, mode = 'create') {
        if (!targetElement) return;

        const feedbackClass = isSuccess ? 'feedback-success' : 'feedback-error';

        if (mode === 'create') {
            const notice = document.createElement('div');
            notice.textContent = message;
            notice.classList.add('feedback', feedbackClass);
            targetElement.appendChild(notice);
            setTimeout(() => notice.remove(), 3000);
        } else if (mode === 'set') {
            targetElement.textContent = message;
            targetElement.classList.add('feedback', feedbackClass);
        }
    }
}
