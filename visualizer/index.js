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

function createBadge(folderKeyword, techName, imageName, style = "blue", parent = null, top = null, styles = {}, target = null, colorize = null, clickable = null, link = null) {
  const techItem = document.createElement('div');
  techItem.className = 'badgeBox';
  if (top !== null) Object.assign(techItem.style, { position: 'absolute', top: `${top}px` });

  if (!clickable) techItem.style.pointerEvents = 'none';
  if (techName) techItem.setAttribute('data-tech-name', techName);

  const createEl = (tag, className, html = '') => {
    const el = document.createElement(tag);
    el.className = className;
    if (html) el.innerHTML = html;
    return el;
  };

  const addStyleClass = (el, suffix) => el.classList.add(`${style}-style-${suffix}`);
  if (["box", "token2"].includes(target)) applyInlineStyle(techItem, styles);
  addStyleClass(techItem, 'box');

  if (imageName) {
    const imageContainer = createEl('div', 'badgeToken');
    getImageByNameFromFolder(folderKeyword, `${imageName}.png`).then(base64 => {
      const appendImage = (img) => {
        imageContainer.appendChild(img);
        techItem.appendChild(imageContainer);
        if (["token", "token2"].includes(target)) applyInlineStyle(imageContainer, styles);
        addStyleClass(imageContainer, 'token');
      };

      if (colorize) {
        const wrapper = createEl('div', `${style}-style-box hover-lock`);
        const temp = createEl('div', `${style}-style-token`);
        wrapper.appendChild(temp);
        document.body.appendChild(wrapper);
        const borderColor = getComputedStyle(temp).borderColor || "#ff0000";
        document.body.removeChild(wrapper);

        tintImageBase64(base64, colorize, (defaultTint) => {
          tintImageBase64(base64, borderColor, (hoverTint) => {
            const img = createEl('div', 'badgeIcon');
            img.style.setProperty('--default-img', `url(${defaultTint})`);
            img.style.setProperty('--hover-img', `url(${hoverTint})`);
            appendImage(img);
          });
        });
      } else {
        const img = createEl('img', 'badgeIcon');
        img.src = `data:image/png;base64,${base64}`;
        appendImage(img);
      }
    });
  }

  if (techName) {
    const nameEl = createEl('div', 'badgeText', techName);
    if (target === "text") applyInlineStyle(nameEl, styles);
    addStyleClass(nameEl, 'text');
    techItem.appendChild(nameEl);
  }

  if (link) {
    Object.assign(techItem.style, { cursor: 'pointer' });
    techItem.setAttribute('role', 'link');
    techItem.setAttribute('tabindex', '0');

    const openLink = () => window.location.href = link;
    techItem.addEventListener('click', openLink);
    techItem.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') openLink();
    });
  }

  parent?.appendChild(techItem);
  return techItem;
}


function applyInlineStyle(el, styles) {
  if (styles && Object.keys(styles).length) {
    Object.entries(styles).forEach(([k, v]) => el.style[k] = v)
  }
};

async function getImageByNameFromFolder(folder, name) {
  try {
    const res = await fetch(`icons/${folder}/${name}`);
    if (!res.ok) throw new Error(`Image not found: ${name}`);
    return getImageAsBase64(await res.blob());
  } catch (err) {
    console.error("Image fetch error:", err);
    throw err
  }
};

function getImageAsBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result.split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(blob)
  })
}

function tintImageBase64(b64, color, cb) {
  const i = new Image(); i.src = `data:image/png;base64,${b64}`;
  i.onload = () => {
    const c = Object.assign(document.createElement('canvas'), { width: i.width, height: i.height }),
      x = c.getContext('2d');
    x.drawImage(i, 0, 0);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    cb(c.toDataURL("image/png"))
  }
};
