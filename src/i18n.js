/**
 * WYSIME - What You See Is Markdown Editor
 * Copyright (c) 2026 Colin Timaxian
 * SPDX-License-Identifier: MIT
 */

const FR = Object.freeze({
  locale: "fr",
  placeholder: "Commencez à écrire…",
  toolbar: {
    aria: "Mise en forme du contenu",
    textStyle: "Style de texte",
    normal: "Normal",
    heading1: "Titre 1",
    heading2: "Titre 2",
    heading3: "Titre 3",
    heading4: "Titre 4",
    quote: "Citation",
    bold: "Gras",
    underline: "Souligner",
    italic: "Italique",
    moreFormatting: "Autres mises en forme",
    strike: "Barrer",
    subscript: "Indice",
    superscript: "Exposant",
    inlineCode: "Code inline",
    clearFormatting: "Effacer la mise en forme",
    bulletList: "Liste à puces",
    orderedList: "Liste numérotée",
    task: "Insérer une tâche",
    alignment: "Alignement",
    alignLeft: "À gauche",
    alignCenter: "Centré",
    alignRight: "À droite",
    alignJustify: "Justifié",
    codeBlock: "Bloc de code",
    image: "Insérer une image",
    table: "Insérer un tableau",
    link: "Insérer un lien",
    callout: "Encadré éditorial",
    steps: "Procédure",
    markdownPreview: "Afficher le Markdown généré",
    moreTools: "Afficher plus d’outils"
  },
  placeholders: {
    text: "texte",
    code: "code",
    listItem: "Élément",
    task: "Tâche"
  },
  common: {
    insert: "Insérer",
    cancel: "Annuler",
    close: "Fermer",
    apply: "Appliquer",
    delete: "Supprimer",
    understood: "Compris"
  },
  code: {
    title: "Insérer du code",
    language: "Langage",
    text: "Texte",
    code: "Code",
    placeholder: "Saisissez ou collez le code…"
  },
  table: {
    insertTitle: "Insérer un tableau",
    rows: "Lignes",
    columns: "Colonnes",
    headerRow: "Première ligne en en-tête",
    headerColumn: "Première colonne en en-tête",
    actions: "Actions du tableau",
    addRow: "Ajouter une ligne",
    removeRow: "Retirer la ligne",
    addColumn: "Ajouter une colonne",
    removeColumn: "Retirer la colonne",
    edit: "Éditer le tableau",
    deleteTable: "Supprimer le tableau",
    editTitle: "Options du tableau",
    column: (index) => `Colonne ${index}`,
    row: (index) => `Ligne ${index}`,
    cell: "À compléter"
  },
  link: {
    title: "Insérer un lien",
    type: "Type de lien",
    external: "URL",
    internal: "Lien interne",
    displayText: "Texte affiché",
    tooltip: "Infobulle (optionnelle)",
    tooltipPlaceholder: "Information affichée au survol",
    defaultLabel: "Lien"
  },
  callout: {
    title: "Insérer un encadré éditorial",
    type: "Type",
    optionalTitle: "Titre optionnel",
    titlePlaceholder: "Titre de l’encadré",
    content: "Contenu",
    contentPlaceholder: "Contenu de l’encadré…",
    info: "Information",
    attention: "Point d’attention",
    success: "Résultat attendu",
    critical: "Critique",
    danger: "Danger",
    defaultContent: "Contenu"
  },
  steps: {
    title: "Insérer une procédure",
    help: "Une ligne par étape. Vous pourrez ensuite éditer directement le contenu dans l’éditeur.",
    steps: "Étapes",
    placeholder: "Première étape\nDeuxième étape\nTroisième étape"
  },
  image: {
    propertiesTitle: "Propriétés de l’image",
    alt: "Texte alternatif",
    width: "Largeur",
    custom: "Personnalisée",
    customWidth: "Largeur personnalisée",
    customWidthPlaceholder: "640px ou 70%",
    defaultAlt: "image",
    uploadMissing: "Aucun adaptateur uploadImage n’est configuré.",
    uploadInvalidUrl: "L’adaptateur d’upload n’a pas retourné une URL d’image autorisée.",
    uploadFailed: "Upload de l’image impossible.",
    uploadDialogTitle: "Image non téléversée",
    noFile: "Aucun fichier sélectionné.",
    unsupported: "Format d’image non supporté.",
    tooLarge: (size) => `L’image dépasse la taille maximale de ${size} Mo.`,
    details: (size) => `Formats acceptés : PNG, JPG, GIF et WebP. Taille maximale : ${size} Mo.`
  },
  markdownPreview: {
    title: "Markdown généré",
    help: "Voici le Markdown actuellement généré par l’éditeur.",
    aria: "Code Markdown généré"
  },
  error: {
    title: "Action impossible"
  }
});

const EN = Object.freeze({
  locale: "en",
  placeholder: "Start writing…",
  toolbar: {
    aria: "Content formatting",
    textStyle: "Text style",
    normal: "Normal",
    heading1: "Heading 1",
    heading2: "Heading 2",
    heading3: "Heading 3",
    heading4: "Heading 4",
    quote: "Quote",
    bold: "Bold",
    underline: "Underline",
    italic: "Italic",
    moreFormatting: "More formatting",
    strike: "Strikethrough",
    subscript: "Subscript",
    superscript: "Superscript",
    inlineCode: "Inline code",
    clearFormatting: "Clear formatting",
    bulletList: "Bulleted list",
    orderedList: "Numbered list",
    task: "Insert task",
    alignment: "Alignment",
    alignLeft: "Align left",
    alignCenter: "Center",
    alignRight: "Align right",
    alignJustify: "Justify",
    codeBlock: "Code block",
    image: "Insert image",
    table: "Insert table",
    link: "Insert link",
    callout: "Editorial callout",
    steps: "Procedure",
    markdownPreview: "View generated Markdown",
    moreTools: "Show more tools"
  },
  placeholders: {
    text: "text",
    code: "code",
    listItem: "Item",
    task: "Task"
  },
  common: {
    insert: "Insert",
    cancel: "Cancel",
    close: "Close",
    apply: "Apply",
    delete: "Delete",
    understood: "OK"
  },
  code: {
    title: "Insert code",
    language: "Language",
    text: "Text",
    code: "Code",
    placeholder: "Enter or paste code…"
  },
  table: {
    insertTitle: "Insert table",
    rows: "Rows",
    columns: "Columns",
    headerRow: "First row is a header",
    headerColumn: "First column is a header",
    actions: "Table actions",
    addRow: "Add row",
    removeRow: "Remove row",
    addColumn: "Add column",
    removeColumn: "Remove column",
    edit: "Edit table",
    deleteTable: "Delete table",
    editTitle: "Table options",
    column: (index) => `Column ${index}`,
    row: (index) => `Row ${index}`,
    cell: "Complete"
  },
  link: {
    title: "Insert link",
    type: "Link type",
    external: "URL",
    internal: "Internal link",
    displayText: "Display text",
    tooltip: "Tooltip (optional)",
    tooltipPlaceholder: "Information shown on hover",
    defaultLabel: "Link"
  },
  callout: {
    title: "Insert editorial callout",
    type: "Type",
    optionalTitle: "Optional title",
    titlePlaceholder: "Callout title",
    content: "Content",
    contentPlaceholder: "Callout content…",
    info: "Information",
    attention: "Attention",
    success: "Expected result",
    critical: "Critical",
    danger: "Danger",
    defaultContent: "Content"
  },
  steps: {
    title: "Insert procedure",
    help: "One line per step. You can edit the content directly in the editor afterwards.",
    steps: "Steps",
    placeholder: "First step\nSecond step\nThird step"
  },
  image: {
    propertiesTitle: "Image properties",
    alt: "Alternative text",
    width: "Width",
    custom: "Custom",
    customWidth: "Custom width",
    customWidthPlaceholder: "640px or 70%",
    defaultAlt: "image",
    uploadMissing: "No uploadImage adapter is configured.",
    uploadInvalidUrl: "The upload adapter did not return an allowed image URL.",
    uploadFailed: "Image upload failed.",
    uploadDialogTitle: "Image not uploaded",
    noFile: "No file selected.",
    unsupported: "Unsupported image format.",
    tooLarge: (size) => `The image exceeds the maximum size of ${size} MB.`,
    details: (size) => `Accepted formats: PNG, JPG, GIF and WebP. Maximum size: ${size} MB.`
  },
  markdownPreview: {
    title: "Generated Markdown",
    help: "This is the Markdown currently generated by the editor.",
    aria: "Generated Markdown source"
  },
  error: {
    title: "Action unavailable"
  }
});

export function getMessages(locale = "fr") {
  return String(locale).toLowerCase().startsWith("en") ? EN : FR;
}

export const SUPPORTED_LOCALES = Object.freeze(["fr", "en"]);
