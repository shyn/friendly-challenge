// @ts-ignore
import css from "./styles.css";
import { ProgressMessage, DoneMessage } from "./types";
import { SOLVER_TYPE_JS } from "friendly-pow/constants";

const loaderSVG = `<circle cx="12" cy="12" r="8" stroke-width="3" stroke-dasharray="15 10" fill="none" stroke-linecap="round" transform="rotate(0 12 12)"><animateTransform attributeName="transform" type="rotate" repeatCount="indefinite" dur="0.9s" values="0 12 12;360 12 12"/></circle>`;
const errorSVG = `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>`;


/**
 * Base template used for all widget states
 * The reason we use raw string interpolation here is so we don't have to ship something like lit-html.
 */
function getTemplate(svgContent: string, textContent: string, solutionString: string, buttonText?: string, progress=false, debugData?: string) {
    return `<div class="frc-container">
<svg class="frc-icon" role="img" xmlns="http://www.w3.org/2000/svg" height="32" width="32" viewBox="0 0 24 24">${svgContent}</svg>
<div class="frc-content">
    <span class="frc-text" ${debugData? `title="${debugData}"`:``}>${textContent}</span>
    ${buttonText?`<button type="button" class="frc-button">${buttonText}</button>`:''}
    ${progress?`<progress class="frc-progress" value="0">0%</progress>`:''}
</div>
</div><span class="frc-banner"><a href="https://friendlycaptcha.com/" rel="noopener" style="text-decoration:none;" target="_blank"><b>Friendly</b>Captcha ⇗</a></span>
<input name="frc-captcha-solution" class="frc-captcha-solution" style="display: none;" type="hidden" value="${solutionString}">`
}

/**
 * Used when the widget is ready to start solving.
 */
export function getReadyHTML() {
    return getTemplate(
        `<path d="M17,11c0.34,0,0.67,0.04,1,0.09V6.27L10.5,3L3,6.27v4.91c0,4.54,3.2,8.79,7.5,9.82c0.55-0.13,1.08-0.32,1.6-0.55 C11.41,19.47,11,18.28,11,17C11,13.69,13.69,11,17,11z"/><path d="M17,13c-2.21,0-4,1.79-4,4c0,2.21,1.79,4,4,4s4-1.79,4-4C21,14.79,19.21,13,17,13z M17,14.38"/>`,
        "Anti-Robot Verification",
        ".UNSTARTED",
        "Press to Start",
        false
    )
}


/**
 * Used when the widget is retrieving a puzzle
 */
export function getFetchingHTML() {
    return getTemplate(
        loaderSVG,
        "Fetching challenge..",
        ".FETCHING",
        undefined,
        true
    )
}


/**
 * Used when the solver is running, displays a progress bar.
 */
export function getRunningHTML() {
    return getTemplate(
        loaderSVG,
        "Verifying you are not a robot..",
        ".UNFINISHED",
        undefined,
        true
    )
}

export function getDoneHTML(solution: string, data: DoneMessage) {
    const timeData = `Completed: ${data.t.toFixed(0)}s (${(data.h/data.t*0.001).toFixed(0)}K/s)${data.solver === SOLVER_TYPE_JS ? " JS Fallback": ""}`;
    return getTemplate(
        `<title>${timeData}</title><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"><animate attributeName="opacity" dur="1.0s" values="0;1"/></path>`,
        "I'm not a robot",
        solution,
        undefined,
        false,
        timeData
    )
}

export function getExpiredHTML() {
    return getTemplate(
        errorSVG,
        "Anti-Robot verification expired",
        ".EXPIRED",
        "Restart"
    )
}

export function getErrorHTML(errorDescription: string, recoverable = true) {
    return getTemplate(
        errorSVG,
        "Verification failed: " + errorDescription,
        ".ERROR",
        recoverable ? "Retry": undefined,
    )
}

export function findCaptchaElement() {
    const el = document.querySelector(".frc-captcha");
    if (!el) {
        console.error("FriendlyCaptcha: No div was found with .frc-captcha class");
    }
    return el;
}

/**
 * Injects the style if no #frc-style element is already present
 * (to support custom stylesheets)
 */
export function injectStyle() {
    if (!document.querySelector("#frc-style")) {
        const styleSheet = document.createElement("style")
        styleSheet.type = "text/css";
        styleSheet.id = "frc-style";
        styleSheet.innerText = css
        document.head.appendChild(styleSheet)
    }
}

/**
 * @param element parent element of friendlycaptcha
 * @param progress value between 0 and 1
 */
export function updateProgressBar(element: HTMLElement, data: ProgressMessage) {
    const p = element.querySelector(".frc-progress") as HTMLProgressElement;
    const perc = (data.i+1)/data.n;
    if (p) {
        p.value = perc;
        p.innerText = perc.toFixed(2) + "%"
        p.title = (data.i+1) + "/" + data.n + " (" + (data.h/data.t*0.001).toFixed(0) + "K/s)";
    }
}

/**
 * Traverses parent nodes until a <form> is found, returns null if not found.
 */
export function findParentFormElement(element: HTMLElement) {
    while(element.tagName !== "FORM") {
        element = element.parentElement as HTMLElement;
        if (!element) {
            return null;
        }
    }
    return element;
}

/**
 * Add listener to specified element that will only fire once on focus.
 */
export function executeOnceOnFocusInEvent(element: HTMLElement, listener: (this: HTMLElement, fe: FocusEvent) => any) {
    element.addEventListener("focusin", listener, {once: true, passive: true});
}