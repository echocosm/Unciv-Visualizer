
// List of HTML pages to check for
const htmlPages = [
  { filename: 'index.html', folder: 'EmojiIcons', techName: 'Home', imageName: 'Happiness' },
  { filename: 'techTree.html', folder: 'EmojiIcons', techName: 'Tech Tree', imageName: 'Science' },
  // Add more here as needed
];

// Run after page loads
window.addEventListener("DOMContentLoaded", () => {
  const parent = document.getElementById('indexBar');

  htmlPages.forEach(page => {
    fetch(page.filename, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          createBadge(
            page.folder,
            page.techName,
            page.imageName,
            'blue',
            parent,
            null,
            {},
            null,
            null,
            true,
            page.filename
          );
        }
      })
      .catch(error => {
        console.log(`Skipping ${page.filename}: ${error}`);
      });
  });
});
// > MAIN 1: createBadge
export async function createBadge(folder, name, img, style = "blue", parent = null, top = null, styles = {}, target = null, color = null, clickable = null, link = null) {
  const box = createBaseBadgeBox(top, clickable);           // >> HELPER 1.1: createBaseBadgeBox
  setBadgeAttributes(box, name, target, styles);            // >> HELPER 1.2: setBadgeAttributes
  applyStyle(box, style, 'box');                            // >> HELPER 1.3: applyStyle

  if (img) {
    const icon = await buildImageIcon(folder, img, style, color, target, styles);  // >> HELPER 1.4: buildImageIcon
    box.appendChild(icon);
  }

  if (name) {
    const text = createBadgeText(name, style, target, styles);                     // >> HELPER 1.5: createBadgeText
    box.appendChild(text);
  }

  addLinkBehavior(box, link);                              // >> HELPER 1.6: addLinkBehavior
  parent?.appendChild(box);
  return box;
}
// >> HELPER 1.1: createBaseBadgeBox
function createBaseBadgeBox(top, clickable) {
  const box = createElement('div', 'badgeBox');            // >>> HELPER 1.1.1: createElement
  if (top !== null) box.style.position = 'absolute', box.style.top = `${top}px`;
  if (!clickable) box.style.pointerEvents = 'none';
  return box;
}
// >>> HELPER 1.1.1: createElement
function createElement(type, className, innerHTML = '') {
  return Object.assign(document.createElement(type), { className, innerHTML });
}
// >> HELPER 1.2: setBadgeAttributes
function setBadgeAttributes(el, name, target, styles) {
  if (name) el.setAttribute('data-tech-name', name);
  if (["box", "token2"].includes(target)) applyInlineStyle(el, styles);   // >>> HELPER 1.2.1: applyInlineStyle
}
// >>> HELPER 1.2.1: applyInlineStyle
function applyInlineStyle(el, styles = {}) {
  Object.entries(styles).forEach(([k, v]) => el.style[k] = v);
}
// >> HELPER 1.3: applyStyle
function applyStyle(el, style, type) {
  el.classList.add(`${style}-style-${type}`);
}
// >> HELPER 1.4: buildImageIcon
async function buildImageIcon(folder, imgName, style, color, target, styles) {
  const wrap = createElement('div', 'badgeToken');
  const b64 = await getImageByNameFromFolder(folder, `${imgName}.png`);         // >>> HELPER 1.4.1: getImageByNameFromFolder

  const icon = color
    ? await buildColorTintedIcon(b64, color, style)                              // >>> HELPER 1.4.2: buildColorTintedIcon
    : Object.assign(createElement('img', 'badgeIcon'), { src: `data:image/png;base64,${b64}` });

  wrap.appendChild(icon);
  if (["token", "token2"].includes(target)) applyInlineStyle(wrap, styles);
  applyStyle(wrap, style, 'token');
  return wrap;
}
// >>> HELPER 1.4.1: getImageByNameFromFolder
async function getImageByNameFromFolder(folder, name) {
  const res = await fetch(`icons/${folder}/${name}`);
  if (!res.ok) throw new Error(`Image not found: ${name}`);
  return getImageAsBase64(await res.blob());              // >>>> HELPER 1.4.1.1: getImageAsBase64
}
// >>>> HELPER 1.4.1.1: getImageAsBase64
function getImageAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}
// >>> HELPER 1.4.2: buildColorTintedIcon
async function buildColorTintedIcon(b64, color, style) {
  const probe = createElement('div', `${style}-style-token`);
  const tmpWrap = createElement('div', `${style}-style-box hover-lock`);
  tmpWrap.appendChild(probe);
  document.body.appendChild(tmpWrap);
  const borderColor = getComputedStyle(probe).borderColor || "#f00";
  document.body.removeChild(tmpWrap);

  const [defaultImg, hoverImg] = await Promise.all([
    tintImageBase64(b64, color),                       // >>>> HELPER 1.4.2.1: tintImageBase64
    tintImageBase64(b64, borderColor)
  ]);

  const icon = createElement('div', 'badgeIcon');
  icon.style.setProperty('--default-img', `url(${defaultImg})`);
  icon.style.setProperty('--hover-img', `url(${hoverImg})`);
  return icon;
}
// >>>> HELPER 1.4.2.1: tintImageBase64
function tintImageBase64(b64, color) {
  return new Promise(res => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    img.onload = () => {
      const canvas = Object.assign(document.createElement('canvas'), {
        width: img.width,
        height: img.height
      });
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      res(canvas.toDataURL("image/png"));
    };
  });
}
// >> HELPER 1.5: createBadgeText
function createBadgeText(name, style, target, styles) {
  const text = createElement('div', 'badgeText', name);
  if (target === "text") applyInlineStyle(text, styles);
  applyStyle(text, style, 'text');
  return text;
}
// >> HELPER 1.6: addLinkBehavior
function addLinkBehavior(el, link) {
  if (!link) return;
  el.style.cursor = 'pointer';
  el.setAttribute('role', 'link');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', `Link to ${link}`);
  const go = () => window.location.href = link;
  el.addEventListener('click', go);
  el.addEventListener('keydown', e => ["Enter", " "].includes(e.key) && go());
}
