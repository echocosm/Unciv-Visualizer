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
function createBadge(folder, name, img, style = "blue", parent = null, top = null, styles = {}, target = null, color = null, clickable = null, link = null) {
  const box = createElement('div', 'badgeBox');

  setBoxPositionAndInteractivity(box, top, clickable);
  setBadgeAttributes(box, name, target, styles);
  applyStyleClass(box, style, 'box');

  if (img) { insertImage(folder, img, style, color, box, target, styles) };

  appendText(box, name, style, target, styles);
  addLinkBehavior(box, link);

  parent?.appendChild(box);
  return box
}
// >> HELPER 1.1: createElement
function createElement(type, className, innerHTML = '') {
  return Object.assign(document.createElement(type), { className, innerHTML });
}
// >> HELPER 1.2: setBoxPositionAndInteractivity
function setBoxPositionAndInteractivity(box, top, clickable) {
  if (top !== null) Object.assign(box.style, { position: 'absolute', top: `${top}px` });
  if (!clickable) box.style.pointerEvents = 'none';
}
// >> HELPER 1.3: setBadgeAttributes
function setBadgeAttributes(box, name, target, styles) {
  if (name) box.setAttribute('data-tech-name', name);
  if (["box", "token2"].includes(target)) applyInlineStyle(box, styles);
}
// >> HELPER 1.4: applyStyleClass
function applyStyleClass(el, style, suffix) {
  el.classList.add(`${style}-style-${suffix}`);
}
// >> HELPER 1.5: insertImage
function insertImage(folder, imgName, style, color, box, target, styles) {
  const wrap = createElement('div', 'badgeToken');
  getImageByNameFromFolder(folder, `${imgName}.png`).then(b64 => {
    const addIcon = icon => {
      wrap.appendChild(icon);
      box.appendChild(wrap);
      if (["token", "token2"].includes(target)) applyInlineStyle(wrap, styles);
      applyStyleClass(wrap, style, 'token');
    };

    if (color) {
      prepareColorTintedIcon(b64, color, style, addIcon);
    } else {
      const img = createElement('img', 'badgeIcon');
      img.src = `data:image/png;base64,${b64}`;
      addIcon(img);
    }
  });
}
// >>> HELPER 1.5.1: getImageByNameFromFolder
async function getImageByNameFromFolder(folder, name) {
  try {
    const response = await fetch(`icons/${folder}/${name}`);
    if (!response.ok) throw new Error(`Image not found: ${name}`);
    const blob = await response.blob();
    return getImageAsBase64(blob);
  } catch (err) {
    console.error("Image fetch error:", err);
    throw err;
  }
}
// >>>> HELPER 1.5.1.1: getImageAsBase64
function getImageAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
// >>> HELPER 1.5.2: prepareColorTintedIcon
function prepareColorTintedIcon(b64, color, style, addIconCallback) {
  const testDiv = createElement('div', `${style}-style-token`);
  const wrapper = createElement('div', `${style}-style-box hover-lock`);
  wrapper.appendChild(testDiv);
  document.body.appendChild(wrapper);
  const borderColor = getComputedStyle(testDiv).borderColor || "#f00";
  document.body.removeChild(wrapper);

  tintImageBase64(b64, color, d => {
    tintImageBase64(b64, borderColor, h => {
      const icon = createElement('div', 'badgeIcon');
      icon.style.setProperty('--default-img', `url(${d})`);
      icon.style.setProperty('--hover-img', `url(${h})`);
      addIconCallback(icon);
    });
  });
}
// >>>> HELPER 1.5.2.1: tintImageBase64
function tintImageBase64(b64, color, callback) {
  const image = new Image();
  image.src = `data:image/png;base64,${b64}`;
  image.onload = () => {
    const canvas = Object.assign(document.createElement('canvas'), {
      width: image.width,
      height: image.height
    });
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    callback(canvas.toDataURL("image/png"));
  };
}
// >> HELPER 1.6: appendText
function appendText(box, name, style, target, styles) {
  if (!name) return;
  const txt = createElement('div', 'badgeText', name);
  if (target === "text") applyInlineStyle(txt, styles);
  applyStyleClass(txt, style, 'text');
  box.appendChild(txt);
}
// >> HELPER 1.7: addLinkBehavior
function addLinkBehavior(box, link) {
  if (!link) return;
  Object.assign(box.style, { cursor: 'pointer' });
  box.setAttribute('role', 'link');
  box.setAttribute('tabindex', '0');
  const go = () => window.location.href = link;
  box.addEventListener('click', go);
  box.addEventListener('keydown', e => ["Enter", " "].includes(e.key) && go());
}