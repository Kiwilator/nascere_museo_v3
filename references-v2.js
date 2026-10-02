/* NASCERE V2 — Sources and attributions panel. */
window.addEventListener('DOMContentLoaded', () => {
  const topActions = document.querySelector('.top-actions');
  const resetButton = document.getElementById('reset-view');
  const panel = document.getElementById('exhibit-panel');
  const panelIndex = document.getElementById('panel-index');
  const panelCategory = document.getElementById('panel-category');
  const panelEyebrow = document.getElementById('panel-eyebrow');
  const panelTitle = document.getElementById('panel-title');
  const panelLead = document.getElementById('panel-lead');
  const panelBody = document.getElementById('panel-body');
  const panelProgress = document.getElementById('panel-progress');

  if (!topActions || !panel) return;

  const button = document.createElement('button');
  button.id = 'references-toggle';
  button.className = 'utility-button';
  button.type = 'button';
  button.textContent = 'REFERENCIAS';
  button.setAttribute('aria-label', 'Referencias y atribuciones');
  topActions.insertBefore(button, resetButton || null);

  const COPY = {
    es: {
      button: 'REFERENCIAS',
      category: 'CRÉDITOS',
      eyebrow: 'FUENTES Y ATRIBUCIONES',
      title: 'Referencias del museo',
      lead: 'Recursos externos utilizados como referencia de diseño o como base técnica en el desarrollo de Nascere.',
      body: `
        <p><strong>De dónde parte Nascere</strong><br>
        Nascere nace en parte del trabajo de investigación desarrollado por Marta Muñoz y su equipo sobre el reciclaje del poliestireno expandido (EPS). <br><br>Sus estudios analizan cómo este material puede disolverse con acetona y reutilizarse posteriormente mediante distintas técnicas de fabricación, entre ellas la impresión 3D y el moldeo. Ese proceso fue el punto de partida para comenzar a experimentar con el EPS desde el diseño y plantear su posible aplicación en joyería.<br><br>A partir de ahí, Nascere lleva la investigación a otro terreno. El proyecto explora qué ocurre cuando ese material reciclado se convierte en una colección de joyas y cómo puede explicarse todo el proceso dentro de un museo virtual.<br><br>La investigación científica, por tanto, sirve como base para la parte material del proyecto. Nascere continúa desde ahí con la experimentación, el diseño de las piezas y su presentación en un entorno digital.</p>
        <p><strong>Artículos de referencia</strong><br>
        García-Sobrino, R., Cortés, A., Calderón-Villajos, R., Díaz, J. G. y Muñoz, M. (2023).<br><strong>Novel and Accessible Physical Recycling for Expanded Polystyrene Waste with the Use of Acetone as a Solvent and Additive Manufacturing (Direct Ink-Write 3D Printing).</strong></p>
        <p><a href="https://www.mdpi.com/2073-4360/15/19/3888" target="_blank" rel="noopener noreferrer" style="color:#176d76;font-weight:600;text-decoration:none;border-bottom:1px solid rgba(23,109,118,.32);">Ver artículo ↗</a></p>
        <p>García-Sobrino, R., Cortés, A., Sevilla-García, J. I. y Muñoz, M. (2024).<br><strong>Sustainable Multi-Cycle Physical Recycling of Expanded Polystyrene Waste for Direct Ink Write 3D Printing and Casting: Analysis of Mechanical Properties.</strong></p>
        <p><a href="https://www.mdpi.com/2073-4360/16/24/3609" target="_blank" rel="noopener noreferrer" style="color:#176d76;font-weight:600;text-decoration:none;border-bottom:1px solid rgba(23,109,118,.32);">Ver artículo ↗</a></p>
      `
    },
    en: {
      button: 'REFERENCES',
      category: 'CREDITS',
      eyebrow: 'SOURCES AND ATTRIBUTIONS',
      title: 'Museum references',
      lead: 'External resources used as design references or technical foundations in the development of Nascere.',
      body: `
        <p><strong>The Origins of Nascere</strong><br>
        Nascere stems in part from research conducted by Marta Muñoz and her team on the recycling of expanded polystyrene (EPS). <br><br>Their studies analyze how this material can be dissolved in acetone and subsequently reused through various manufacturing techniques, including 3D printing and molding. This process served as the starting point for experimenting with EPS from a design perspective and considering its potential application in jewelry.<br><br>From there, Nascere takes the research into new territory. The project explores what happens when this recycled material is transformed into a jewelry collection and how the entire process can be presented within a virtual museum.<br><br>Scientific research, therefore, serves as the foundation for the material aspect of the project. Nascere continues from there with the experimentation, the design of the pieces and their presentation in a digital environment.</p> 
        <p><strong>Reference articles</strong><br> 
        García-Sobrino, R., Cortés, A., Calderón-Villajos, R., Díaz, J. G. and Muñoz, M. (2023).<br><strong>Novel and Accessible Physical Recycling for Expanded Polystyrene Waste with the Use of Acetone as a Solvent and Additive Manufacturing (Direct Ink-Write 3D Printing).</strong></p> 
        <p><a href="https://www.mdpi.com/2073-4360/15/19/3888" target="_blank" rel="noopener noreferrer" style="color:#176d76;font-weight:600;text-decoration:none;border-bottom:1px solid rgba(23,109,118,.32);">See article ↗</a></p> 
        <p>García-Sobrino, R., Cortés, A., Sevilla-García, J. I. and Muñoz, M. (2024).<br><strong>Sustainable Multi-Cycle Physical Recycling of Expanded Polystyrene Waste for Direct Ink Write 3D Printing and Casting: Analysis of Mechanical Properties.</strong></p> 
        <p><a href="https://www.mdpi.com/2073-4360/16/24/3609" target="_blank" rel="noopener noreferrer" style="color:#176d76;font-weight:600;text-decoration:none;border-bottom:1px solid rgba(23,109,118,.32);">See article ↗</a></p>
      `
    }
  };

  function language() {
    return document.documentElement.lang === 'en' ? 'en' : 'es';
  }

  function syncButtonLabel() {
    const copy = COPY[language()];
    button.textContent = copy.button;
    button.setAttribute('aria-label', language() === 'en' ? 'References and attributions' : 'Referencias y atribuciones');
  }

  function openReferences() {
    const copy = COPY[language()];
    panel.dataset.exhibit = 'references';
    panelIndex.textContent = 'R';
    panelCategory.textContent = copy.category;
    panelEyebrow.textContent = copy.eyebrow;
    panelTitle.textContent = copy.title;
    panelLead.textContent = copy.lead;
    panelBody.innerHTML = copy.body;
    panelProgress.textContent = 'REF';
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');

    const intro = document.getElementById('intro-card');
    if (intro) intro.classList.add('is-hidden');
  }

  button.addEventListener('click', openReferences);

  document.querySelectorAll('[data-language]').forEach((languageButton) => {
    languageButton.addEventListener('click', () => {
      window.setTimeout(() => {
        syncButtonLabel();
        if (panel.classList.contains('is-open') && panel.dataset.exhibit === 'references') {
          openReferences();
        }
      }, 0);
    });
  });

  syncButtonLabel();
});
