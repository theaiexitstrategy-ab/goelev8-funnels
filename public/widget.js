// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
(function() {
  'use strict';

  var slug = document.currentScript && document.currentScript.getAttribute('data-funnel');
  if (!slug) {
    var params = new URLSearchParams(window.location.search);
    slug = params.get('funnel');
  }
  if (!slug) return;

  // Create floating chat button
  var btn = document.createElement('div');
  btn.id = 'ge8-widget-btn';
  btn.innerHTML =
    '<div style="' +
      'position:fixed;bottom:20px;right:20px;width:56px;height:56px;' +
      'background:#00CFFF;border-radius:50%;display:flex;align-items:center;' +
      'justify-content:center;cursor:pointer;z-index:9999;' +
      'box-shadow:0 4px 20px rgba(0,207,255,0.4);' +
      'transition:transform 0.2s;font-size:24px;' +
    '" onclick="window.__ge8Toggle()" ' +
    'onmouseover="this.style.transform=\'scale(1.1)\'" ' +
    'onmouseout="this.style.transform=\'scale(1)\'">&#x1F4AC;</div>';

  // Create chat iframe
  var iframe = document.createElement('iframe');
  iframe.id = 'ge8-widget-frame';
  iframe.src = 'https://goelev8.ai/f/' + encodeURIComponent(slug) + '?widget=1';
  iframe.style.cssText =
    'position:fixed;bottom:90px;right:20px;width:360px;height:500px;' +
    'border:none;border-radius:12px;z-index:9998;display:none;' +
    'box-shadow:0 8px 40px rgba(0,0,0,0.4);';

  document.body.appendChild(btn);
  document.body.appendChild(iframe);

  window.__ge8Toggle = function() {
    var f = document.getElementById('ge8-widget-frame');
    if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
  };
})();
