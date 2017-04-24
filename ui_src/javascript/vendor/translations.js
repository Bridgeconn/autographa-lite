window.localization = window.localization || {},
function(n) {
    localization.translate = {

      menu: function() {
        $(".verse-diff-on #label-on").text(i18n.__('btn-switch-on'));
        $(".verse-diff-on #label-off").text(i18n.__('btn-switch-off'));
      },
      translation: function() {
        $('#learn-more-button').text(i18n.__('Learn more'));
        $('.translation').text(i18n.__('label-translation'));
        $(document).find("title").text(i18n.__('app-name-Autographa-Lite'))
      },
      settings: function(){
        $("#defaultOpen").text(i18n.__('label-translation-details'))
        $("#label-import-translation").text(i18n.__('label-import-translation'))
        $("#label-import-ref-text").text(i18n.__('label-import-ref-text'))
        $("#label-manage-ref-texts").text(i18n.__('label-manage-ref-texts'))
        $(".label-language-code").text(i18n.__('label-language-code'))
        $(".label-version").text(i18n.__('label-version'))
        $("#label-export-folder-location").text(i18n.__('label-export-folder-location'))
        $(".label-folder-location").text(i18n.__('label-folder-location'))
        $("#label-bible-name").text(i18n.__('label-bible-name'))
        $("#label-book-chapter").text(i18n.__('label-book-chapter'))
        $(".btn-save").text(i18n.__('btn-save'))
        $(".btn-import").text(i18n.__('btn-import'))
        $("#exportUsfm").text(i18n.__('btn-export'))
        $("#btn-ok").text(i18n.__('btn-ok'))
        $("#btnfindReplace").text(i18n.__('btn-replace'))
        $("#btn-save-changes").text(i18n.__('btn-save-changes'))
        $("#tbl-header-name").text(i18n.__('tbl-header-name'))
        $("#tbl-header-action").text(i18n.__('tbl-header-action'))
        $("#modal-title-setting").text(i18n.__('modal-title-setting'))
        $("#book-chapter-btn").attr('title', i18n.__('tooltip-select-book'))
        $("#chapterBtn").attr('title', i18n.__('tooltip-select-chapter'))
        $("#switchLable").attr('title', i18n.__('tooltip-compare-mode'))
        $("#searchText").attr('title', i18n.__('tooltip-find-and-replace'))
        $("#btnfindReplace").attr('title', i18n.__('tooltip-run-find-and-replace'))
        $("#label-find-replace").text(i18n.__('label-find-replace'))
        $("#label-current-chapter").text(i18n.__('label-current-chapter'))
        $("#label-current-book").text(i18n.__('label-current-book'))
        $("#label-find").text(i18n.__('label-find'))
        $("#label-replace-with").text(i18n.__('label-replace-with'))
        $("#export-heading").text(i18n.__('tooltip-export-usfm'))
        $("#replace-information").text(i18n.__('label-replaced-information'))
        $("#replace-cancel").text(i18n.__('btn-cancel'))
        $("#searchTextBox").attr('placeholder', i18n.__('placeholder-search-text'))
        $("#replaceTextBox").attr('placeholder', i18n.__('placeholder-replace-text'))
        $("#export-usfm").attr('title', i18n.__('tooltip-export-usfm'))
        $("#export-path").attr('placeholder', i18n.__('placeholder-path-to-destination'))
        $(".import").attr('placeholder', i18n.__('placeholder-path-of-usfm-files'))
        $("#ref-name").attr('placeholder', i18n.__('placeholder-eng-translation'))
        $("#btnAbout").attr('title', i18n.__('tooltip-about'))
        $("#btnSettings").attr('title', i18n.__('tooltip-settings'))
        $(".minus").attr('title', i18n.__('tooltip-minus-font-size'))
        $(".plus").attr('title', i18n.__('tooltip-plus-font-size'))
        $("#2-column-layout").attr('title', i18n.__('tooltip-2-column'))
        $("#3-column-layout").attr('title', i18n.__('tooltip-3-column'))
        $("#4-column-layout").attr('title', i18n.__('tooltip-4-column'))
        $("#save-btn").attr('title', i18n.__('tooltip-btn-save'))
        $(".close").attr('title', i18n.__('tooltip-modal-close'))
        $(".ref-drop-down").attr('title', i18n.__('tooltip-select-reference-text'))
        $("#modal-title-about").text(i18n.__('modal-title-about'))
        $("#overviewtab").text(i18n.__('label-overview-tab'))
        $("#licensetab").text(i18n.__('label-license-tab'))
        $("#booksTab").text(i18n.__('label-books-tab'))
        $("#chapterTab").text(i18n.__('label-chapter-tab'))
        $("#allBooksBtn").text(i18n.__('btn-all'))
        $("#otBooksBtn").text(i18n.__('btn-ot'))
        $("#allBooksBtn").attr('title', i18n.__('tooltip-all'))
        $("#otBooksBtn").attr('title', i18n.__('tooltip-old-testament'))
        $("#ntBooksBtn").text(i18n.__('btn-nt'))
        $("#ntBooksBtn").attr('title', i18n.__('tooltip-new-testament'))
        $("#app-name").text(i18n.__('app-name-Autographa-Lite'))
        $("#label-hosted-url").text(i18n.__('label-hosted-url'))
        $(".stage").text(i18n.__('label-stage'))
        $("#stageText").attr('placeholder', i18n.__('placeholder-stage-trans'))
      },

      init: function() {
        this.translation();
        this.menu();
        this.settings();
      }
    };

    n(function() {
        localization.translate.init();
    })

}(jQuery);
