
    let  isPopupOpen = false, selectedTechItem = null, techsData, buildingsData, unitsData, tileImprovementsData, nationsData;

    async function loadJsonFiles() {
      [techsData, buildingsData, unitsData, tileImprovementsData, nationsData] =
        await Promise.all([
          'Techs', 'Buildings', 'Units', 'TileImprovements', 'Nations'
        ].map(f => fetch(`jsons/${f}.json`).then(r => r.json())));
    }

    function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)) };

    async function createTechTree() {
      const container = document.getElementById('techTree');
      //container.innerHTML = '';
      document.body.style.overflowX = 'hidden';

      let lastEra = "", eraHeaderGroup, eraColCont, positionTop, isLightBlue = true;
      loadJsonFiles();
      for (const group of techsData) {
        await delay(1)
        if (group.era !== lastEra) {
          eraHeaderGroup = document.createElement('div')
          const eraHeader = Object.assign(document.createElement('div'), { className: 'techEraHead' });
          eraHeader.innerText = group.era;
          eraHeader.style.backgroundColor = isLightBlue ? 'lightblue' : '#c0eaf7';
          eraHeaderGroup.appendChild(eraHeader);
          eraColCont = Object.assign(document.createElement('div'), { className: 'techColCont' });
          eraHeaderGroup.appendChild(eraColCont);
          container.appendChild(eraHeaderGroup);
          lastEra = group.era;
          isLightBlue = !isLightBlue;
        }
        const column = Object.assign(document.createElement('div'), { className: 'techCol' });
        column.style.backgroundColor = isLightBlue ? 'lightblue' : '#c0eaf7';

        for (const tech of group.techs || []) {
          await delay(1)
          const item = await createBadge('TechIcons', tech.name, tech.name, 'blue', column, (tech.row * 50) - 50, null, null, 'blue', true);
          item.classList.add('treeBranch');
          item.addEventListener('click', () => showTechDetails(tech, group, item));
        }
        eraColCont.appendChild(column);
      }
      await delay(1);
      drawAllLines();
      addHoverEffectToTechItems();
      document.body.style.overflowX = 'auto';  // Restore default horizontal scrolling
    };

    function drawLine(techItem1, techItem2) {
      const style = getComputedStyle(techItem1);
      const paddingTop = parseInt(style.paddingTop, 10);
      const paddingBottom = parseInt(style.paddingBottom, 10);
      const borderTop = parseInt(style.borderTopWidth, 10);
      const borderBottom = parseInt(style.borderBottomWidth, 10);
      const marginTop = parseInt(getComputedStyle(document.getElementById('techTree')).marginTop, 10);
      const height = 2 + paddingTop + paddingBottom + borderTop + borderBottom - marginTop;

      if (techItem1 && techItem2) {
        const [rect1, rect2] = [techItem1.getBoundingClientRect(), techItem2.getBoundingClientRect()];
        const [sx, sy, ex, ey] = [
          rect1.left + rect1.width / 2, (rect1.top + height) - (rect1.height / 2),
          rect2.left + rect2.width / 2, (rect2.top + height) - (rect2.height / 2)
        ];
        const connectedTech = `${techItem1.dataset.techName}-${techItem2.dataset.techName}`;
        const lineColor = getComputedStyle(techItem1).borderColor;
        const createLine = (style) => {
          const line = document.createElement('div');
          line.classList.add('line');
          Object.assign(line.style, {
            backgroundColor: lineColor, 
            ...style});
          console.log("style: "+ style.borderColor)
          line.dataset.connectedTech = connectedTech;
          document.querySelector('.techColCont').appendChild(line)
        };
        if (Math.abs(sy - ey) < 10) {
          createLine({ left: `${Math.min(sx, ex)}px`, top: `${sy}px`, width: `${Math.abs(ex - sx)}px` });
        } else {
          const hx = (Math.abs(ex - sx) / 2), vh = Math.abs(ey - sy);
          const vd = (sy > ey) ? -1 : 1;
          createLine({ left: `${sx}px`, top: `${sy}px`, width: `${hx - 12}px` });
          createLine({ left: `${sx + hx - 8}px`, height: '23px', transform: `rotate(${vd === -1 ? '45' : '-45'}deg)`, top: `${sy - (vd === -1 ? 17 : 2)}px` });
          createLine({ left: `${sx + hx}px`, top: `${16 + (vd === -1 ? ey : sy)}px`, height: `${vh - 28}px` });
          createLine({ left: `${sx + hx + 7}px`, height: '23px', transform: `rotate(${vd === -1 ? '45' : '-45'}deg)`, top: `${ey - (vd === -1 ? 2 : 17)}px` });
          createLine({ left: `${sx + hx + 15}px`, top: `${ey}px`, width: `${hx - 15}px` });
        }
      }
    };

    const drawAllLines = () => {
      techsData.forEach(group => {
        group.techs?.forEach(tech => {
          tech.prerequisites?.forEach(prerequisiteName => {
            const techItem1 = document.querySelector(`.badgeBox[data-tech-name="${prerequisiteName}"]`);
            const techItem2 = document.querySelector(`.badgeBox[data-tech-name="${tech.name}"]`);
            if (techItem1 && techItem2) { drawLine(techItem1, techItem2) }
          })
        })
      })
    };

    function addHoverEffectToTechItems() {
      document.querySelectorAll('.treeBranch').forEach(item => {
        item.addEventListener('mouseenter', () => updateLineHover(item, true));
        item.addEventListener('mouseleave', () => updateLineHover(item, false))
      })
    };

    function updateLineHover(item, isHover) {
      if (!isPopupOpen) {
        const hoveredTechName = item.dataset.techName;
        document.querySelectorAll('.line').forEach(line => {
          if (line.dataset.connectedTech.includes(hoveredTechName)) {
            line.classList.toggle('hover-lock', isHover)
          }
        })
      }
    };

    import { createBadge } from "./index.js";

    function showTechDetails(tech, group, item) {
      isPopupOpen = true;
      selectedTechItem = item
      selectedTechItem.classList.add('hover-lock');
      document.getElementById('techTree').classList.add('freeze');
      const techpopup = document.getElementById('techPopup'); //techEra
      techpopup.style.display = 'inline-flex';

      function createInfoBar({ relatedItems, iconType, barLabel, styleGroup }, override) {
        function getBorderColorFromClass(className) {
          const targetSelector = `.${className}-style-box`;
          for (const sheet of document.styleSheets) {
            try {
              for (const rule of sheet.cssRules || []) {
                if (rule.selectorText && rule.selectorText.includes(targetSelector)) { return rule.style.borderColor || null }
              }
            } catch (e) { continue }
          } return null
        };

        const colorize = getBorderColorFromClass(styleGroup);
        const bar = createBadge("OtherIcons", null, barLabel, styleGroup, techpopup, null, { width: '100%' }, "box", colorize);

        if (relatedItems.length) {
          const groups = {}, replacedSet = new Set(relatedItems.map(i => i.replaces).filter(Boolean));

          relatedItems.forEach(i => {
            const isUnique = !!i.uniqueTo, isReplaced = replacedSet.has(i.name);
            const parent = isUnique
              ? createBadge(null, null, null, styleGroup, bar, null, null, null)
              : bar;
            const item = !isReplaced
              ? createBadge(iconType, i.name, override || i.name, styleGroup, parent, null, null, null, colorize)
              : null;

            if (isUnique) {
              const n = nationsData.find(n => n.name === i.uniqueTo);
              if (n) {
                createBadge("NationIcons", i.uniqueTo, i.uniqueTo, null, parent, null, {
                  backgroundColor: `rgb(${n.outerColor?.join(',')})`,
                  borderColor: `rgb(${n.innerColor?.join(',')})`,
                  color: `rgb(${n.innerColor?.join(',')})`
                }, "token2", `rgb(${n.innerColor?.join(',')})`)
              }
            };

            if (i.replaces) {
              if (!groups[i.replaces]) {
                groups[i.replaces] = {
                  replaced: createBadge(iconType, i.replaces, i.replaces, styleGroup, bar, null, null, null, colorize),
                  replacers: []
                }
              }
              groups[i.replaces].replacers.push(isUnique ? parent : item)
            }
          });

          Object.values(groups).forEach(g => {
            createBadge(null, null, null, styleGroup, bar, null, {
              display: 'inline-block',
              flexWrap: 'wrap',
              flexDirection: 'row'
            }, "box").then(c=>{
            c.appendChild(g.replaced);
            g.replacers.forEach(r => c.appendChild(r))
          })})


        }
      };

      //cost and era
      techpopup.innerHTML = '';

      const close = createBadge('OtherIcons', null, 'Close', 'grey', techpopup, null, { width: '100%' }, null, 'grey', true);
      close.onclick = closePopup;

      const costera = createBadge(null, null, null, "blank", techpopup);
      createBadge("EmojiIcons", group.era || "~", "Turn", "blue", costera, null, null, null, "blue");
      createBadge("EmojiIcons", group.techCost || "~", "Science", "science", costera);

      const fbholder = createBadge(null, null, null, "blank", techpopup);
      const backward = createBadge("OtherIcons", null, "BackArrow", "blue", fbholder, null, { flexDirection: 'row' }, "box", "blue");
      tech.prerequisites?.forEach(prerequisiteName => {
        createBadge("TechIcons", prerequisiteName, prerequisiteName, "blue", backward, null, null, null, "blue")
      });
      const forward = createBadge("OtherIcons", null, "ForwardArrow", "blue", fbholder, null, {}, "box", "blue");
      techsData.forEach(techGroup => {
        techGroup.techs?.forEach(listing => {
          if (listing.prerequisites?.includes(tech.name)) {
            createBadge("TechIcons", listing.name, listing.name, "blue", forward, null, null, null, "blue")
          }
        })
      });
      //name
      createBadge("TechIcons", tech.name, tech.name, "blue", techpopup, null, { fontSize: '36px' }, "text", "blue");

      //quote
      createBadge("TechIcons", tech.quote, null, "quote", techpopup, null, null, null);

      const uniqueObjects = tech.uniques?.map(unique => ({ name: unique })) || [];
      createInfoBar({
        relatedItems: uniqueObjects,
        iconType: "UniqueIcons",
        barLabel: "ExclamationMark",
        styleGroup: "yellow"
      }, "Fallback");
      const relatedBuildings = buildingsData.filter(b => b.requiredTech === tech.name && !b.isWonder && !b.isNationalWonder);
      createInfoBar({
        relatedItems: relatedBuildings,
        iconType: "BuildingIcons",
        barLabel: "Cities",
        styleGroup: "grey"
      });
      const relatedWonders = buildingsData.filter(b => b.requiredTech === tech.name && (b.isWonder || b.isNationalWonder));
      createInfoBar({
        relatedItems: relatedWonders,
        iconType: "BuildingIcons",
        barLabel: "Wonders",
        styleGroup: "purple"
      });
      const relatedUnits = unitsData.filter(unit => unit.requiredTech === tech.name);
      createInfoBar({
        relatedItems: relatedUnits,
        iconType: "UnitIcons",
        barLabel: "Shield",
        styleGroup: "red"
      });
      const relatedTileImprovements = tileImprovementsData.filter(tile => tile.techRequired === tech.name);
      createInfoBar({
        relatedItems: relatedTileImprovements,
        iconType: "ImprovementIcons",
        barLabel: "Improvements",
        styleGroup: "green"
      });
    }

    function closePopup() {
      document.getElementById('techPopup').style.display = 'none';
      isPopupOpen = false;
      selectedTechItem?.classList.remove('hover-lock');
      document.querySelectorAll('.line').forEach(line => line.classList.remove('hover-lock'));
      document.getElementById('techTree').classList.remove('freeze');
    }

    loadJsonFiles().then(() => {
      createTechTree()
    });
