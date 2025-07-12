'use client';
import { jsx } from 'react/jsx-runtime';
import { forwardRef, useState, useEffect, useRef, useMemo, useImperativeHandle } from 'react';

const Component = ({ as: Element = "div", ...props }, ref) => {
  return /* @__PURE__ */ jsx(Element, { ...props, ref });
};
const Container = forwardRef(Component);

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";
const DEFAULT_SCRIPT_ID = "cf-turnstile-script";
const DEFAULT_CONTAINER_ID = "cf-turnstile";
const DEFAULT_ONLOAD_NAME = "onloadTurnstileCallback";
const checkElementExistence = (id) => !!document.getElementById(id);
const injectTurnstileScript = ({
  render = "explicit",
  onLoadCallbackName = DEFAULT_ONLOAD_NAME,
  scriptOptions: {
    nonce = "",
    defer = true,
    async = true,
    id = "",
    appendTo,
    onError,
    crossOrigin = ""
  } = {}
}) => {
  const scriptId = id || DEFAULT_SCRIPT_ID;
  if (checkElementExistence(scriptId)) {
    return;
  }
  const script = document.createElement("script");
  script.id = scriptId;
  script.src = `${SCRIPT_URL}?onload=${onLoadCallbackName}&render=${render}`;
  if (document.querySelector(`script[src="${script.src}"]`)) {
    return;
  }
  script.defer = !!defer;
  script.async = !!async;
  if (nonce) {
    script.nonce = nonce;
  }
  if (crossOrigin) {
    script.crossOrigin = crossOrigin;
  }
  if (onError) {
    script.onerror = onError;
  }
  const parentEl = appendTo === "body" ? document.body : document.getElementsByTagName("head")[0];
  parentEl.appendChild(script);
};
const CONTAINER_STYLE_SET = {
  normal: {
    width: 300,
    height: 65
  },
  compact: {
    width: 130,
    height: 120
  },
  invisible: {
    width: 0,
    height: 0,
    overflow: "hidden"
  },
  interactionOnly: {
    width: "fit-content",
    height: "auto"
  }
};
function getTurnstileSizeOpts(size) {
  let result;
  if (size !== "invisible") {
    result = size;
  }
  return result;
}

function useObserveScript(scriptId = DEFAULT_SCRIPT_ID) {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  useEffect(() => {
    const checkScriptExists = () => {
      if (checkElementExistence(scriptId)) {
        setScriptLoaded(true);
      }
    };
    const observer = new MutationObserver(checkScriptExists);
    observer.observe(document, { childList: true, subtree: true });
    checkScriptExists();
    return () => {
      observer.disconnect();
    };
  }, [scriptId]);
  return scriptLoaded;
}

const Turnstile = forwardRef((props, ref) => {
  const {
    scriptOptions,
    options = {},
    siteKey,
    onWidgetLoad,
    onSuccess,
    onExpire,
    onError,
    onBeforeInteractive,
    onAfterInteractive,
    onUnsupported,
    onLoadScript,
    id,
    style,
    as = "div",
    injectScript = true,
    ...divProps
  } = props;
  const widgetSize = options.size ?? "normal";
  const [containerStyle, setContainerStyle] = useState(
    options.execution === "execute" ? CONTAINER_STYLE_SET.invisible : options.appearance === "interaction-only" ? CONTAINER_STYLE_SET.interactionOnly : CONTAINER_STYLE_SET[widgetSize]
  );
  const containerRef = useRef(null);
  const firstRendered = useRef(false);
  const [widgetId, setWidgetId] = useState();
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const containerId = id ?? DEFAULT_CONTAINER_ID;
  const scriptId = injectScript ? scriptOptions?.id || `${DEFAULT_SCRIPT_ID}__${containerId}` : scriptOptions?.id || DEFAULT_SCRIPT_ID;
  const scriptLoaded = useObserveScript(scriptId);
  const onLoadCallbackName = scriptOptions?.onLoadCallbackName ? `${scriptOptions.onLoadCallbackName}__${containerId}` : `${DEFAULT_ONLOAD_NAME}__${containerId}`;
  const renderConfig = useMemo(
    () => ({
      sitekey: siteKey,
      action: options.action,
      cData: options.cData,
      callback: onSuccess,
      "error-callback": onError,
      "expired-callback": onExpire,
      "before-interactive-callback": onBeforeInteractive,
      "after-interactive-callback": onAfterInteractive,
      "unsupported-callback": onUnsupported,
      theme: options.theme ?? "auto",
      language: options.language ?? "auto",
      tabindex: options.tabIndex,
      "response-field": options.responseField,
      "response-field-name": options.responseFieldName,
      size: getTurnstileSizeOpts(widgetSize),
      retry: options.retry ?? "auto",
      "retry-interval": options.retryInterval ?? 8e3,
      "refresh-expired": options.refreshExpired ?? "auto",
      execution: options.execution ?? "render",
      appearance: options.appearance ?? "always"
    }),
    [
      siteKey,
      options,
      onSuccess,
      onError,
      onExpire,
      widgetSize,
      onBeforeInteractive,
      onAfterInteractive,
      onUnsupported
    ]
  );
  const renderConfigStringified = useMemo(() => JSON.stringify(renderConfig), [renderConfig]);
  useImperativeHandle(
    ref,
    () => {
      if (typeof window === "undefined" || !scriptLoaded) {
        return;
      }
      const { turnstile } = window;
      return {
        getResponse() {
          if (!turnstile?.getResponse || !widgetId) {
            console.warn("Turnstile has not been loaded");
            return;
          }
          return turnstile.getResponse(widgetId);
        },
        reset() {
          if (!turnstile?.reset || !widgetId) {
            console.warn("Turnstile has not been loaded");
            return;
          }
          if (options.execution === "execute") {
            setContainerStyle(CONTAINER_STYLE_SET.invisible);
          }
          try {
            turnstile.reset(widgetId);
          } catch (error) {
            console.warn(`Failed to reset Turnstile widget ${widgetId}`, error);
          }
        },
        remove() {
          if (!turnstile?.remove || !widgetId) {
            console.warn("Turnstile has not been loaded");
            return;
          }
          setWidgetId("");
          setContainerStyle(CONTAINER_STYLE_SET.invisible);
          turnstile.remove(widgetId);
        },
        render() {
          if (!turnstile?.render || !containerRef.current || widgetId) {
            console.warn("Turnstile has not been loaded or widget already rendered");
            return;
          }
          const id2 = turnstile.render(containerRef.current, renderConfig);
          setWidgetId(id2);
          if (options.execution !== "execute") {
            setContainerStyle(CONTAINER_STYLE_SET[widgetSize]);
          }
          return id2;
        },
        execute() {
          if (options.execution !== "execute") {
            return;
          }
          if (!turnstile?.execute || !containerRef.current || !widgetId) {
            console.warn("Turnstile has not been loaded or widget has not been rendered");
            return;
          }
          turnstile.execute(containerRef.current, renderConfig);
          setContainerStyle(CONTAINER_STYLE_SET[widgetSize]);
        },
        isExpired() {
          if (!turnstile?.isExpired || !widgetId) {
            console.warn("Turnstile has not been loaded");
            return;
          }
          return turnstile.isExpired(widgetId);
        }
      };
    },
    [scriptLoaded, widgetId, options.execution, widgetSize, renderConfig, containerRef]
  );
  useEffect(() => {
    window[onLoadCallbackName] = () => setTurnstileLoaded(true);
    return () => {
      delete window[onLoadCallbackName];
    };
  }, [onLoadCallbackName]);
  useEffect(() => {
    if (injectScript && !turnstileLoaded) {
      injectTurnstileScript({
        onLoadCallbackName,
        scriptOptions: {
          ...scriptOptions,
          id: scriptId
        }
      });
    }
  }, [injectScript, turnstileLoaded, onLoadCallbackName, scriptOptions, scriptId]);
  useEffect(() => {
    if (scriptLoaded && !turnstileLoaded && window.turnstile) {
      setTurnstileLoaded(true);
    }
  }, [turnstileLoaded, scriptLoaded]);
  useEffect(() => {
    if (!siteKey) {
      console.warn("sitekey was not provided");
      return;
    }
    if (!scriptLoaded || !containerRef.current || !turnstileLoaded || firstRendered.current) {
      return;
    }
    const id2 = window.turnstile.render(containerRef.current, renderConfig);
    setWidgetId(id2);
    firstRendered.current = true;
  }, [scriptLoaded, siteKey, renderConfig, firstRendered, turnstileLoaded]);
  useEffect(() => {
    if (!window.turnstile)
      return;
    if (containerRef.current && widgetId) {
      if (checkElementExistence(widgetId)) {
        window.turnstile.remove(widgetId);
      }
      const newWidgetId = window.turnstile.render(containerRef.current, renderConfig);
      setWidgetId(newWidgetId);
      firstRendered.current = true;
    }
  }, [renderConfigStringified, siteKey]);
  useEffect(() => {
    if (!window.turnstile)
      return;
    if (!widgetId)
      return;
    if (!checkElementExistence(widgetId))
      return;
    onWidgetLoad?.(widgetId);
    return () => {
      window.turnstile.remove(widgetId);
    };
  }, [widgetId, onWidgetLoad]);
  useEffect(() => {
    setContainerStyle(
      options.execution === "execute" ? CONTAINER_STYLE_SET.invisible : renderConfig.appearance === "interaction-only" ? CONTAINER_STYLE_SET.interactionOnly : CONTAINER_STYLE_SET[widgetSize]
    );
  }, [options.execution, widgetSize, renderConfig.appearance]);
  useEffect(() => {
    if (!scriptLoaded || typeof onLoadScript !== "function")
      return;
    onLoadScript();
  }, [scriptLoaded, onLoadScript]);
  return /* @__PURE__ */ jsx(
    Container,
    {
      ref: containerRef,
      as,
      id: containerId,
      style: { ...containerStyle, ...style },
      ...divProps
    }
  );
});
Turnstile.displayName = "Turnstile";

export { DEFAULT_CONTAINER_ID, DEFAULT_ONLOAD_NAME, DEFAULT_SCRIPT_ID, SCRIPT_URL, Turnstile };
