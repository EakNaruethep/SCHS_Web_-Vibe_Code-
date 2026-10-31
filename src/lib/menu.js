// Builds the desktop header menu (Makewebeasy "header-menu-01" markup) from data/site/menu.json.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function sub(items, level) {
  const lis = items.map((n) => {
    const kids = n.children?.length ? sub(n.children, level + 1) : '';
    const arrow = kids ? '<span class="ml-auto pl-15"><i class="far fa-angle-right"></i></span>' : '';
    return `<li class="cursor-pointer${kids ? ' has-sub' : ''}"><a class="nav-link dropdown-item dropdown-toggle d-flex abl${level + 1}" href="${encodeURI(n.url)}" target="_self"><span>${esc(n.name)}</span>${arrow}</a>${kids}</li>`;
  }).join('');
  return `<ul class="dropdown-menu menu-lv${level}"><div class="menu-list-container list-${level}">${lis}</div></ul>`;
}

export function desktopMenu(items, current = '') {
  return items.map((n) => {
    const kids = n.children?.length ? sub(n.children, 1) : '';
    const active = n.url === '/' ? current === '/' : current === n.url || current.startsWith(n.url + '/');
    const caret = kids ? '<span><i class="fal fa-chevron-down fa-xs fa-fw"></i></span>' : '';
    return `<li class="nav-item dropdown cursor-pointer${active ? ' active' : ''}"><a class="nav-link dropdown-toggle abl1" href="${encodeURI(n.url)}" target="_self"><span>${esc(n.name)}</span> ${caret}</a>${kids}</li>`;
  }).join('') +
    // Items that don't fit on the bar are moved in here by scripts/site.js, like Makewebeasy's "เพิ่มเติม".
    '<li id="menu_more" class="nav-item dropdown more d-none"><a href="#" class="nav-link dropdown-toggle amore cursor-pointer">เพิ่มเติม <i class="fal fa-chevron-down fa-xs fa-fw"></i></a><ul class="dropdown-menu menu-lv1"><div class="menu-list-container list-1"></div></ul></li>';
}

// Phone side menu (Makewebeasy "menu-sidenav-mobile-01"): level 1 is rendered here, deeper levels are opened
// by scripts/site.js from the JSON copy of the menu kept in the page.
const SIDENAV_STYLE = '--sidenav-width: 315px; --sidenav-lv1-transform: translate3d(-325px, 0, 0); --sidenav-otherlv-transform: translate3d(-315px, 0, 0); --sidenav-boxshadow: 0px 8px 16px rgba(0, 0, 0, 0.15); --sidenav-background: rgba(var(--tpc-11), 100%); --menulist-maxheight: calc(100vh - 56px); --btnback-fontsize: 14px; --mainmenu-separatorcolor: rgba(var(--tpc-3), 0%); --mainmenu-fontcolor: rgba(var(--tpc-24), 100%); --mainmenu-fontsize: 18px; --mainmenu-fontfamily: "Kanit_Regular", "Tahoma"; --mainmenu-fontweight: normal; --mainmenu-fontstyle: normal; --mainmenu-fontdecoration: none; --mainmenu-active-bg-color: rgba(var(--tpc-33), 100%); --mainmenu-active-fontcolor: rgba(var(--tpc-11), 100%); --mainmenu-active-bordercolor: transparent; --submenu-separatorcolor: rgba(var(--tpc-12), 80%); --submenu-fontcolor: rgba(var(--tpc-24), 100%); --submenu-fontsize: 18px; --submenu-fontfamily: Kanit_Regular, "Tahoma"; --submenu-fontweight: normal; --submenu-fontstyle: normal; --submenu-fontdecoration: none; --footerzone-width: min-content; --footerzone-maxwidth: 370px;';

export function sidenavItem(n, active, i, cls = 'menu-list-item-title') {
  const kids = n.children?.length;
  return `<li class="${active ? 'active' : ''}" data-i="${i}"${kids ? ' data-has-sub' : ''}><div class="${cls}"><div class="menu-text${kids ? '' : ' pr-20'}"><span>${esc(n.name)}</span> <a href="${encodeURI(n.url)}" target="_self" style="display:none;">${esc(n.name)}</a></div>${kids ? ' <div class="menu-arrow"><i class="fal fa-angle-right"></i></div>' : ''}</div></li>`;
}

export function mobileMenu(items, current = '') {
  const isActive = (n) => (n.url === '/' ? current === '/' : current === n.url || current.startsWith(n.url + '/'));
  const panel = (lv) => `<div id="side-nav-lv${lv}" class="side-nav hide"><div class="side-nav-title"><div class="back-btn"><i class="fal fa-angle-left"></i> <span class="label ml-10"></span></div> <div class="close-btn"><i class="fal fa-times"></i></div></div> <div id="menu-list-container-lv${lv}" class="menu-list-container"></div></div>`;
  return `<div id="header-sidenav-menu-mobile"><div id="menu-sidenav-mobile-01" style='${SIDENAV_STYLE}'><div id="topwidget-menu" class="topwidget-menu">`
    + '<div id="side-nav-overlay" class="hide"></div>'
    + `<div id="side-nav-lv1" class="side-nav add-transition"><div class="side-nav-title"><div class="close-btn"><i class="fal fa-times"></i></div></div> <div id="menu-list-container-lv1" class="menu-list-container"><ul id="menu-level1" class="menu-list">${items.map((n, i) => sidenavItem(n, isActive(n), i)).join('')}</ul></div></div>`
    + panel(2) + panel(3) + panel(4)
    + `</div></div><script type="application/json" id="sidenav-data">${JSON.stringify(items).replace(/</g, '\\u003c')}</script></div>`;
}
