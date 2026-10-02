import { describe, expect, it } from "vitest";
import { openEquationDialog } from "../src/dialogs.js";

async function nextTick() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("equation dialog", () => {
  it("docks above the MathLive keyboard only while the keyboard is visible", async () => {
    document.body.innerHTML = "";
    const moduleSource = `
      class FakeMathField extends HTMLElement {}
      if (!customElements.get("math-field")) customElements.define("math-field", FakeMathField);
      export class MathfieldElement extends HTMLElement {}
      const keyboard = new EventTarget();
      keyboard.container = document.body;
      keyboard.visible = false;
      keyboard.hidden = true;
      keyboard.shown = false;
      keyboard.boundingRect = { height: 312 };
      keyboard.show = function() {
        this.dispatchEvent(new CustomEvent("before-virtual-keyboard-toggle", { detail: { visible: true } }));
        this.visible = true;
        this.shown = true;
        this.hidden = false;
        this.dispatchEvent(new CustomEvent("geometrychange", { detail: { boundingRect: this.boundingRect } }));
        this.dispatchEvent(new CustomEvent("virtual-keyboard-toggle", { detail: { visible: true } }));
      };
      keyboard.hide = function() {
        this.dispatchEvent(new CustomEvent("before-virtual-keyboard-toggle", { detail: { visible: false } }));
        this.visible = false;
        this.hidden = true;
        this.dispatchEvent(new CustomEvent("virtual-keyboard-toggle", { detail: { visible: false } }));
      };
      export const mathVirtualKeyboard = keyboard;
    `;
    const mathliveUrl = `data:text/javascript,${encodeURIComponent(moduleSource)}`;
    const runtimeModule = await import(mathliveUrl);

    const resultPromise = openEquationDialog("x^2", {
      locale: "fr",
      visualRuntime: { mathlive: mathliveUrl },
      display: true,
      mode: "edit"
    });
    await nextTick();
    await nextTick();

    const dialog = document.querySelector(".wysime-equation-dialog");
    const keyboardHost = dialog?.querySelector("[data-math-keyboard-host]");
    const keyboardMount = dialog?.querySelector("[data-math-keyboard-mount]");
    expect(dialog).not.toBeNull();
    expect(keyboardHost).not.toBeNull();
    expect(keyboardMount).not.toBeNull();
    expect(runtimeModule.mathVirtualKeyboard.container).toBe(keyboardMount);
    expect(keyboardHost.parentElement).toBe(dialog);
    expect(keyboardHost.closest(".wysime-dialog-body")).toBeNull();

    const field = dialog.querySelector("math-field[data-math-field]");
    expect(field.mathVirtualKeyboardPolicy).toBe("manual");
    expect(runtimeModule.mathVirtualKeyboard.shown).toBe(true);
    expect(dialog.classList.contains("wysime-equation-dialog-with-keyboard")).toBe(true);
    expect(keyboardHost.classList.contains("wysime-math-keyboard-visible")).toBe(true);
    expect(dialog.style.getPropertyValue("--wysime-math-keyboard-height")).toBe("312px");

    runtimeModule.mathVirtualKeyboard.hide();
    await nextTick();
    expect(dialog.classList.contains("wysime-equation-dialog-with-keyboard")).toBe(false);
    expect(keyboardHost.classList.contains("wysime-math-keyboard-visible")).toBe(false);
    expect(keyboardHost.getAttribute("aria-hidden")).toBe("true");

    runtimeModule.mathVirtualKeyboard.show();
    await nextTick();
    expect(dialog.classList.contains("wysime-equation-dialog-with-keyboard")).toBe(true);
    expect(keyboardHost.classList.contains("wysime-math-keyboard-visible")).toBe(true);

    dialog.querySelector("[data-cancel]").click();
    await resultPromise;

    expect(runtimeModule.mathVirtualKeyboard.hidden).toBe(true);
    expect(runtimeModule.mathVirtualKeyboard.container).toBe(document.body);
  });
});
