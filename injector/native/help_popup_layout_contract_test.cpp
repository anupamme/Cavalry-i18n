/**
 * [INPUT]: 依赖Qt6.9.2、401根布局表、跨平台384/17说明查询与布局策略，不依赖文档对象ABI。
 * [OUTPUT]: 验证三语自然上限、长短切换、正文行界与未知结构透传。
 * [POS]: 仓外构建时运行的隐藏Qt fixture；不启动Cavalry或改产品控件。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "help_description_lookup.h"
#include "help_popup_layout_abi_contract.h"
#include "help_popup_layout_policy.h"
#include NATIVE_HELP_LAYOUT_ROWS
#include NATIVE_HELP_DESCRIPTION_TABLE

#include <QtCore/QMargins>
#include <QtCore/QRegularExpression>
#include <QtCore/QString>
#include <QtCore/QStringList>
#include <QtGui/QImage>
#include <QtGui/QPainter>
#include <QtGui/qrgb.h>
#include <QtGui/QTextLayout>
#include <QtGui/QTextOption>
#include <QtWidgets/QApplication>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QLabel>
#include <QtWidgets/QVBoxLayout>
#include <QtWidgets/QWidget>

#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <string_view>
#include <vector>

namespace {

using native_help_popup_metadata::Row;
using native_help_description::HelpDescriptionEntry;
using Locale = cavalry_native_font::Locale;

int failures = 0;

struct LocaleLabels {
    const char *name;
    QString function;
    QString arguments;
    QString returns;
    QString description;
    Locale locale;
};

struct Snapshot {
    int popupWidth = 0;
    int popupHeight = 0;
    QRect bodyRect;
    QRect titleRect;
    bool wordWrap = false;
    int requiredBodyHeight = 0;
};

struct ApiCase {
    const Row *layout = nullptr;
    const HelpDescriptionEntry *help = nullptr;
};

void expect(bool condition, const char *name)
{
    if (condition) {
        std::cout << "PASS " << name << '\n';
    } else {
        std::cerr << "FAIL " << name << '\n';
        ++failures;
    }
}

QString toQString(std::string_view value)
{
    return QString::fromUtf8(value.data(), static_cast<qsizetype>(value.size()));
}

std::string_view helpText(const HelpDescriptionEntry &entry, Locale locale)
{
    switch (locale) {
        case Locale::Hans: return entry.zhHans;
        case Locale::Hant: return entry.zhHant;
        case Locale::Japanese: return entry.jaJp;
        case Locale::Unset:
        case Locale::English:
        case Locale::Unknown: return {};
    }
    return {};
}

const Row *findLayoutRow(std::string_view name)
{
    const Row *match = nullptr;
    for (std::size_t index = 0;
         index < native_help_popup_metadata::kRowCount; ++index) {
        const Row &row = native_help_popup_metadata::kRows[index];
        if (row.runtimeName != name) continue;
        if (match != nullptr) return nullptr;
        match = &row;
    }
    return match;
}

const HelpDescriptionEntry *findHelpEntry(std::string_view name)
{
    const HelpDescriptionEntry *match = nullptr;
    const auto scan = [&](const HelpDescriptionEntry *entries, std::size_t count) {
        for (std::size_t index = 0; index < count; ++index) {
            if (entries[index].runtimeName != name) continue;
            if (match != nullptr) return false;
            match = &entries[index];
        }
        return true;
    };
    if (!scan(native_help_description::kApprovedRuntimeRootHelp,
              native_help_description::kApprovedRuntimeRootHelpCount)
        || !scan(native_help_description::kApprovedRuntimeDefHelp,
                 native_help_description::kApprovedRuntimeDefHelpCount)) {
        return nullptr;
    }
    return match;
}

ApiCase findApi(std::string_view name)
{
    return {findLayoutRow(name), findHelpEntry(name)};
}

QString valueText(const ApiCase &api, bool arguments)
{
    if (api.layout == nullptr) return {};
    return toQString(arguments ? api.layout->argumentsText
                               : api.layout->returnsText);
}

class PopupFixture final {
public:
    QWidget root;
    QVBoxLayout *top = nullptr;
    QLabel *kind = nullptr;
    QLabel *name = nullptr;
    QWidget *argumentsWidget = nullptr;
    QLabel *argumentsValue = nullptr;
    QWidget *returnsWidget = nullptr;
    QLabel *returnsValue = nullptr;
    QHBoxLayout *descriptionRow = nullptr;
    QLabel *descriptionTitle = nullptr;
    QLabel *description = nullptr;
    int originalMinimumWidth = 0;

    explicit PopupFixture(const LocaleLabels &labels)
    {
        originalMinimumWidth = root.minimumWidth();
        root.setAttribute(Qt::WA_DontShowOnScreen, true);
        top = new QVBoxLayout(&root);
        top->setContentsMargins(12, 6, 12, 6);
        top->setSpacing(0);

        auto *functionRow = new QHBoxLayout;
        kind = new QLabel(labels.function);
        functionRow->addWidget(kind);
        functionRow->addSpacing(6);
        name = new QLabel;
        functionRow->addWidget(name);
        functionRow->addStretch();
        top->addLayout(functionRow);

        argumentsWidget = makeInfoRow(labels.arguments, &argumentsValue);
        returnsWidget = makeInfoRow(labels.returns, &returnsValue);
        top->addWidget(argumentsWidget);
        top->addWidget(returnsWidget);

        descriptionRow = new QHBoxLayout;
        descriptionRow->setContentsMargins(0, 0, 0, 0);
        descriptionRow->setSpacing(0);
        descriptionTitle = new QLabel(labels.description);
        description = new QLabel;
        descriptionRow->addWidget(descriptionTitle);
        descriptionRow->addWidget(description);
        descriptionRow->addStretch();
        top->addLayout(descriptionRow);
        root.show();
    }

    void setContent(const ApiCase &api, QString body)
    {
        if (api.layout == nullptr) return;
        // -- 模拟vendor：先写正文，再写参数/返回值，最后切换行显隐 ---------
        description->setText(body);
        kind->setText(toQString(api.layout->kind));
        name->setText(toQString(api.layout->runtimeName));
        returnsValue->setText(valueText(api, false));
        argumentsValue->setText(valueText(api, true));
        argumentsWidget->setVisible(!api.layout->argumentsText.empty());
        returnsWidget->setVisible(!api.layout->returnsText.empty());
    }

private:
    static QWidget *makeInfoRow(const QString &titleText, QLabel **valueOut)
    {
        auto *container = new QWidget;
        auto *row = new QHBoxLayout(container);
        row->setContentsMargins(0, 0, 0, 0);
        row->setSpacing(0);
        row->addWidget(new QLabel(titleText));
        auto *value = new QLabel;
        row->addWidget(value);
        row->addStretch();
        *valueOut = value;
        return container;
    }
};

struct OneLocaleEnvelope final {
    bool initialized = false;
    int calls = 0;
    int width = 0;
    std::string_view widestKey;

    bool measureOnce(QLayout *layout)
    {
        if (!initialized) {
            initialized = true;
            ++calls;
            width = native_help_popup_layout::measureCatalogEnvelope(
                layout, native_help_popup_metadata::kRows,
                native_help_popup_metadata::kRowCount, &widestKey);
        }
        return width > 0;
    }
};

bool siblingLabelsDoNotOverlap(QWidget *root)
{
    const auto labels = root->findChildren<QLabel *>();
    for (int left = 0; left < labels.size(); ++left) {
        if (!labels[left]->isVisibleTo(root)) continue;
        for (int right = left + 1; right < labels.size(); ++right) {
            if (!labels[right]->isVisibleTo(root)
                || labels[right]->parentWidget() != labels[left]->parentWidget()) {
                continue;
            }
            if (labels[left]->geometry().intersects(labels[right]->geometry())) {
                return false;
            }
        }
    }
    return true;
}

bool visibleLabelsAreNotClipped(QWidget *root, QLabel *description)
{
    const auto labels = root->findChildren<QLabel *>();
    for (QLabel *label : labels) {
        if (!label->isVisibleTo(root)) continue;
        if (label->width() <= 0 || label->height() <= 0) return false;
        if (label == description) {
            const int requiredHeight = label->heightForWidth(label->width());
            if (label->height() < label->fontMetrics().height()) return false;
            if (label->wordWrap()) {
                if (requiredHeight <= 0 || label->height() < requiredHeight) {
                    return false;
                }
            } else if (label->width() < label->sizeHint().width()) {
                return false;
            }
            continue;
        }
        const QSize naturalSize = label->sizeHint();
        if (label->width() < naturalSize.width()
            || label->height() < naturalSize.height()) {
            return false;
        }
    }
    return true;
}

bool labelPaintsVisibleInk(QLabel *label)
{
    if (!label || label->width() <= 0 || label->height() <= 0) return false;
    QImage image(label->size(), QImage::Format_ARGB32_Premultiplied);
    image.fill(Qt::transparent);
    QPainter painter(&image); label->render(&painter); painter.end();
    for (int y = 0; y < image.height(); ++y) {
        for (int x = 0; x < image.width(); ++x) {
            if (qAlpha(image.pixel(x, y)) != 0) return true;
        }
    }
    return false;
}

bool wrappedTextKeepsWordsOnSingleLines(QLabel *label,
                                        const QString &expectedText,
                                        const QStringList &words)
{
    if (!label || label->text() != expectedText || !label->wordWrap()
        || label->textFormat() == Qt::RichText || label->width() <= 0) {
        return false;
    }
    QTextOption option;
    option.setWrapMode(QTextOption::WordWrap);
    QTextLayout layout(expectedText, label->font());
    layout.setTextOption(option);
    layout.beginLayout();
    std::vector<std::pair<int, int>> lineRanges;
    int covered = 0;
    bool withinWidth = true;
    while (true) {
        QTextLine line = layout.createLine();
        if (!line.isValid()) break;
        line.setLineWidth(label->contentsRect().width());
        const int start = line.textStart();
        const int end = start + line.textLength();
        if (start != covered || end < start
            || line.naturalTextWidth() > label->contentsRect().width() + 0.5) {
            withinWidth = false;
        }
        lineRanges.emplace_back(start, end);
        covered = end;
        std::cout << "DRAW-LINE start=" << start << " end=" << end
                  << " width=" << line.naturalTextWidth()
                  << " cap=" << label->contentsRect().width() << '\n';
    }
    layout.endLayout();
    if (!withinWidth || covered != expectedText.size() || lineRanges.empty()) {
        return false;
    }
    for (const QString &word : words) {
        const int start = expectedText.indexOf(word);
        if (start < 0) return false;
        const int end = start + word.size();
        const int containingLines = static_cast<int>(std::count_if(
            lineRanges.begin(), lineRanges.end(), [&](const auto &range) {
                return start >= range.first && end <= range.second;
            }));
        if (containingLines != 1) return false;
    }
    return true;
}

bool hasOneAsciiSpaceAfterEveryIdeographicComma(const QString &text)
{
    for (qsizetype index = 0; index < text.size(); ++index) {
        if (text[index] != QChar(0x3001)) continue;
        if (index + 1 >= text.size() || text[index + 1] != QLatin1Char(' ')
            || (index + 2 < text.size()
                && text[index + 2] == QLatin1Char(' '))) {
            return false;
        }
    }
    return true;
}

Snapshot showContent(PopupFixture &fixture, OneLocaleEnvelope &cache,
                     const ApiCase &api, Locale locale, const char *label,
                     bool expectShort)
{
    const std::string_view translated = helpText(*api.help, locale);
    const QString body = toQString(translated);
    fixture.setContent(api, body);
    const QFont fontBefore = fixture.description->font();
    const QString styleBefore = fixture.description->styleSheet();
    const Qt::TextFormat formatBefore = fixture.description->textFormat();
    const QMargins marginsBefore = fixture.description->contentsMargins();
    const QMargins popupMarginsBefore = fixture.top->contentsMargins();
    const QMargins rowMarginsBefore = fixture.descriptionRow->contentsMargins();
    const int popupSpacingBefore = fixture.top->spacing();
    const int rowSpacingBefore = fixture.descriptionRow->spacing();
    const QFont titleFontBefore = fixture.descriptionTitle->font();
    const QString titleStyleBefore = fixture.descriptionTitle->styleSheet();
    const QMargins titleMarginsBefore = fixture.descriptionTitle->contentsMargins();
    const int minimumWidthBeforeApply = fixture.root.minimumWidth();
    const int titleWidth = fixture.descriptionTitle->sizeHint().width();
    const QMargins rowMargins = fixture.descriptionRow->contentsMargins();
    const int bodyCap = cache.width - rowMargins.left() - rowMargins.right()
        - titleWidth - fixture.descriptionRow->spacing();
    const int naturalPopupHintWidth = fixture.top->sizeHint().width()
        + fixture.top->contentsMargins().left()
        + fixture.top->contentsMargins().right();
    native_help_popup_layout::detail::LabelProbe naturalProbe(
        *fixture.description);
    const int naturalWidth = naturalProbe.width(translated);
    const bool naturalMeasured = naturalWidth >= 0;
    const bool expectedWrap = naturalMeasured && naturalWidth > bodyCap;

    expect(fixture.description->text() == body,
           "source-bound body remains full before layout");
    expect(!body.contains(QLatin1Char('\n')),
           "test description has no injected hard line break");
    expect(naturalMeasured && bodyCap > 0,
           "current popup measures natural body and positive cap");
    expect(native_help_popup_layout::applyUniformEnvelope(
               fixture.top, fixture.description, cache.width), label);
    expect(fixture.description->text() == body,
           "layout leaves approved translation unchanged");
    const int minimumWidthAfterApply = fixture.root.minimumWidth();
    expect(minimumWidthAfterApply == minimumWidthBeforeApply,
           "layout preserves the host minimum-width property");
    expect(fixture.description->maximumWidth() == bodyCap,
           "body maximum subtracts host title, margins and spacing");
    expect(fixture.description->font() == fontBefore
               && fixture.description->styleSheet() == styleBefore
               && fixture.description->textFormat() == formatBefore
               && fixture.description->contentsMargins() == marginsBefore
               && fixture.top->contentsMargins() == popupMarginsBefore
               && fixture.descriptionRow->contentsMargins() == rowMarginsBefore
               && fixture.top->spacing() == popupSpacingBefore
               && fixture.descriptionRow->spacing() == rowSpacingBefore
               && fixture.descriptionTitle->font() == titleFontBefore
               && fixture.descriptionTitle->styleSheet() == titleStyleBefore
               && fixture.descriptionTitle->contentsMargins() == titleMarginsBefore,
           "layout preserves host font, style, format and padding");

    // -- 与host顺序一致：apply后只激活一次，再沿用vendor的adjustSize。 ----
    fixture.top->activate();
    fixture.root.adjustSize();

    Snapshot snapshot;
    snapshot.popupWidth = fixture.root.width();
    snapshot.popupHeight = fixture.root.height();
    snapshot.bodyRect = fixture.description->geometry();
    snapshot.titleRect = fixture.descriptionTitle->geometry();
    snapshot.wordWrap = fixture.description->wordWrap();
    const int lineHeight = fixture.description->fontMetrics().height();
    const int requiredHeight = fixture.description->heightForWidth(
        snapshot.bodyRect.width());
    snapshot.requiredBodyHeight = requiredHeight;
    const int popupCap = cache.width + fixture.top->contentsMargins().left()
        + fixture.top->contentsMargins().right();
    std::cout << "STATE locale=" << label << " api=" << api.layout->runtimeName
              << " popup=" << snapshot.popupWidth << 'x' << snapshot.popupHeight
              << " cap=" << popupCap << " body=" << snapshot.bodyRect.width()
              << 'x' << snapshot.bodyRect.height() << " natural=" << naturalWidth
              << " requiredHeight=" << requiredHeight
              << " naturalPopupHint=" << naturalPopupHintWidth
              << " minimumBeforeApply=" << minimumWidthBeforeApply
              << " minimumAfterApply=" << minimumWidthAfterApply
              << " wrap=" << snapshot.wordWrap << '\n';
    expect(snapshot.popupWidth > 0 && snapshot.popupWidth <= popupCap,
           "popup uses catalog width as a maximum, not a fixed width");
    expect(snapshot.bodyRect.width() > 0 && snapshot.bodyRect.width() <= bodyCap
               && snapshot.bodyRect.height() >= lineHeight
               && (requiredHeight <= 0 || snapshot.bodyRect.height() >= requiredHeight),
           "body geometry has enough natural height and stays within its cap");
    expect(snapshot.wordWrap == expectedWrap,
           "wrap follows unwrapped natural width");
    if (!expectedWrap) {
        expect(snapshot.bodyRect.width() >= naturalWidth,
               "single-line body keeps its natural width without early wrapping");
    }
    expect(snapshot.titleRect.top() == snapshot.bodyRect.top()
               && snapshot.titleRect.right() < snapshot.bodyRect.left(),
           "description title aligns to the first body line");
    if (expectedWrap) {
        expect(snapshot.bodyRect.height() > lineHeight,
               "long body grows vertically after natural wrap");
    }
    if (expectShort) {
        expect(!snapshot.wordWrap && snapshot.bodyRect.width() >= naturalWidth
                   && snapshot.popupWidth < popupCap,
               "short body and popup keep their natural width");
    }
    expect(fixture.root.maximumHeight() == QWIDGETSIZE_MAX,
           "layout leaves popup height unconstrained");
    expect(siblingLabelsDoNotOverlap(&fixture.root),
           "visible labels retain non-overlapping geometry");
    expect(visibleLabelsAreNotClipped(&fixture.root, fixture.description),
           "all visible labels fit their measured geometry");
    return snapshot;
}

bool sameNaturalFlowHeight(const Snapshot &left, const Snapshot &right)
{
    return left.popupHeight == right.popupHeight
        && left.bodyRect.height() == right.bodyRect.height()
        && left.titleRect.height() == right.titleRect.height()
        && left.wordWrap == right.wordWrap
        && left.requiredBodyHeight == right.requiredBodyHeight;
}

struct TokenOverflow final {
    std::string_view runtimeName;
    std::string_view key;
    QString token;
    qreal lineNaturalWidth = 0;
    qreal tokenLeft = 0;
    qreal tokenRight = 0;
};

std::vector<TokenOverflow> findWordWrapTokenOverflows(
    const HelpDescriptionEntry *entries, std::size_t count,
    const QFont &font, Locale locale, int bodyWidth)
{
    std::vector<TokenOverflow> results;
    const QRegularExpression tokenPattern(
        QStringLiteral("[A-Za-z][A-Za-z0-9_.-]{9,}"));
    QTextOption wordWrap;
    wordWrap.setWrapMode(QTextOption::WordWrap);

    for (std::size_t entryIndex = 0; entryIndex < count; ++entryIndex) {
        const HelpDescriptionEntry &entry = entries[entryIndex];
        const QString body = toQString(helpText(entry, locale));
        if (body.isEmpty()) continue;

        QTextLayout wrapped(body, font);
        wrapped.setTextOption(wordWrap);
        wrapped.beginLayout();
        while (true) {
            QTextLine line = wrapped.createLine();
            if (!line.isValid()) break;
            line.setLineWidth(bodyWidth);
            const QString segment = body.mid(line.textStart(), line.textLength());
            const QRegularExpressionMatchIterator matches =
                tokenPattern.globalMatch(segment);
            if (matches.hasNext()) {
                QTextLayout unwrapped(segment, font);
                unwrapped.beginLayout();
                QTextLine naturalLine = unwrapped.createLine();
                if (naturalLine.isValid()) {
                    naturalLine.setLineWidth(QWIDGETSIZE_MAX);
                    QRegularExpressionMatchIterator tokenMatches =
                        tokenPattern.globalMatch(segment);
                    while (tokenMatches.hasNext()) {
                        const QRegularExpressionMatch match = tokenMatches.next();
                        const qreal tokenLeft = naturalLine.cursorToX(
                            match.capturedStart());
                        const qreal tokenRight = naturalLine.cursorToX(
                            match.capturedEnd());
                        if (tokenLeft >= bodyWidth || tokenRight <= bodyWidth) {
                            continue;
                        }
                        const Row *row = findLayoutRow(entry.runtimeName);
                        results.push_back({
                            entry.runtimeName,
                            row ? row->key : std::string_view{},
                            match.captured(),
                            line.naturalTextWidth(),
                            tokenLeft,
                            tokenRight,
                        });
                    }
                }
                unwrapped.endLayout();
            }
        }
        wrapped.endLayout();
    }
    return results;
}

void testPaletteEnumRendering(const LocaleLabels &labels)
{
    const ApiCase palette = findApi("generateHarmoniousPalette");
    expect(palette.layout && palette.help,
           "palette regression resolves from the approved 401-row sources");
    if (!palette.layout || !palette.help) return;

    PopupFixture fixture(labels);
    const QString approvedBody = toQString(
        helpText(*palette.help, labels.locale));
    fixture.setContent(palette, approvedBody);
    expect(fixture.description->text() == approvedBody,
           "palette regression uses the complete approved source text");

    // -- 复用旧实机观察的675px外壳作为目录宽度上限。 ------------------
    constexpr int observedPopupWidth = 675;
    const QMargins rootMargins = fixture.top->contentsMargins();
    const int observedEnvelope = observedPopupWidth
        - rootMargins.left() - rootMargins.right();
    OneLocaleEnvelope fixtureEnvelope;
    expect(fixtureEnvelope.measureOnce(fixture.top),
           "same Qt fixture measures the complete 401-row catalog");
    expect(observedEnvelope == 651,
           "popup geometry maps to the live 401-item envelope");
    expect(native_help_popup_layout::applyUniformEnvelope(
               fixture.top, fixture.description, observedEnvelope),
           "palette fixture applies the live catalog envelope");
    expect(fixture.description->wordWrap(),
           "palette body uses the production word-wrap branch");
    fixture.top->activate();
    fixture.root.adjustSize();

    const int observedDescriptionWidth = fixture.description->contentsRect().width();

    std::cout << "TOKEN-FIXTURE locale=" << labels.name << " api="
              << palette.layout->runtimeName
              << " envelope=" << observedEnvelope
              << " fixture401Envelope=" << fixtureEnvelope.width
              << " observedBodyWidth=" << observedDescriptionWidth
              << " fixtureBody=" << fixture.description->width() << 'x'
              << fixture.description->height()
              << " hfw=" << fixture.description->heightForWidth(
                     observedDescriptionWidth)
              << " popup=" << fixture.root.width() << 'x'
              << fixture.root.height()
              << " minimumWidth=" << fixture.root.minimumWidth()
              << " expanding="
              << static_cast<int>(fixture.top->expandingDirections())
              << " sizeHint=" << fixture.root.sizeHint().width() << 'x'
              << fixture.root.sizeHint().height() << '\n';

    const QStringList enumWords{QStringLiteral("monochromatic"),
        QStringLiteral("analogous"), QStringLiteral("complementary"),
        QStringLiteral("splitComplementary"), QStringLiteral("triadic"),
        QStringLiteral("square"), QStringLiteral("rectangular"),
        QStringLiteral("circular"), QStringLiteral("goldenRatio")};
    expect(hasOneAsciiSpaceAfterEveryIdeographicComma(approvedBody),
           "approved source has one ordinary space after each enum separator");
    expect(fixture.description->textFormat() != Qt::RichText
               && fixture.description->text() == approvedBody,
           "actual QLabel renders the complete approved non-rich source");
    expect(labelPaintsVisibleInk(fixture.description),
           "actual QLabel render contains visible glyph pixels");
    expect(wrappedTextKeepsWordsOnSingleLines(
               fixture.description, approvedBody, enumWords),
           "actual WordWrap line extents keep every enum token intact");

    if (const char *capture = std::getenv("NATIVE_HELP_LAYOUT_CAPTURE")) {
        QString capturePath = QString::fromLocal8Bit(capture);
        if (labels.locale != Locale::Hans) {
            const int suffix = capturePath.lastIndexOf(QStringLiteral(".png"));
            if (suffix >= 0) {
                capturePath.insert(suffix, QStringLiteral("-")
                    + QString::fromUtf8(labels.name));
            } else {
                capturePath += QStringLiteral("-")
                    + QString::fromUtf8(labels.name) + QStringLiteral(".png");
            }
        }
        QImage image(fixture.root.size(), QImage::Format_ARGB32_Premultiplied);
        image.fill(Qt::transparent);
        QPainter painter(&image);
        fixture.root.render(&painter);
        painter.end();
        expect(image.save(capturePath),
               "hidden fixture stores the rendered regression image");
    }

    const auto overflows = findWordWrapTokenOverflows(
        native_help_description::kApprovedRuntimeRootHelp,
        native_help_description::kApprovedRuntimeRootHelpCount,
        fixture.description->font(), labels.locale, observedDescriptionWidth);
    const auto defOverflows = findWordWrapTokenOverflows(
        native_help_description::kApprovedRuntimeDefHelp,
        native_help_description::kApprovedRuntimeDefHelpCount,
        fixture.description->font(), labels.locale, observedDescriptionWidth);

    bool targetOverflow = false;
    for (const TokenOverflow &overflow : overflows) {
        std::cout << "TOKEN-OVERFLOW group=root name=" << overflow.runtimeName
                  << " key=" << overflow.key << " token="
                  << overflow.token.toStdString()
                  << " lineNatural=" << overflow.lineNaturalWidth
                  << " tokenX=" << overflow.tokenLeft << ".."
                  << overflow.tokenRight << " cap="
                  << observedDescriptionWidth << '\n';
        if (overflow.runtimeName == "generateHarmoniousPalette"
            && overflow.token == QStringLiteral("rectangular")) {
            targetOverflow = true;
        }
    }
    for (const TokenOverflow &overflow : defOverflows) {
        std::cout << "TOKEN-OVERFLOW group=def name=" << overflow.runtimeName
                  << " key=" << overflow.key << " token="
                  << overflow.token.toStdString()
                  << " lineNatural=" << overflow.lineNaturalWidth
                  << " tokenX=" << overflow.tokenLeft << ".."
                  << overflow.tokenRight << " cap="
                  << observedDescriptionWidth << '\n';
    }
    std::cout << "TOKEN-SCAN rootRows="
              << native_help_description::kApprovedRuntimeRootHelpCount
              << " defRows="
              << native_help_description::kApprovedRuntimeDefHelpCount
              << " rootOverflows=" << overflows.size()
              << " defOverflows=" << defOverflows.size() << '\n';
    expect(!targetOverflow,
           "corrected source no longer splits rectangular at the 401-row cap");
    expect(overflows.empty() && defOverflows.empty(),
           "401 root and 17 def rows have no other long-token overflow for this locale");
}

bool testUnknownLayoutRemainsUntouched()
{
    QWidget root;
    root.setAttribute(Qt::WA_DontShowOnScreen, true);
    auto *top = new QVBoxLayout(&root);
    auto *description = new QLabel(QStringLiteral("unknown structure"));
    description->setWordWrap(true);
    description->setMaximumWidth(73);
    top->addWidget(description);
    root.setMaximumWidth(311);
    const auto originalText = description->text();
    const auto originalMaximum = description->maximumWidth();
    const auto originalWrap = description->wordWrap();
    const auto originalPopupMaximum = root.maximumWidth();
    const bool accepted = native_help_popup_layout::applyUniformEnvelope(
        top, description, 500);
    expect(native_help_popup_layout::descriptionLabel(top) == nullptr,
           "unknown row shape has no approved description owner");
    expect(!accepted && description->text() == originalText
               && description->maximumWidth() == originalMaximum
               && description->wordWrap() == originalWrap
               && root.maximumWidth() == originalPopupMaximum,
           "unknown row shape remains byte-for-byte untouched");
    return !accepted;
}
#include "help_popup_layout_sequence_test.inc"
void runLocale(const LocaleLabels &labels)
{
    const ApiCase install = findApi("installPlugin");
    const ApiCase map = findApi("map");
    const ApiCase playApi = findApi("play");
    expect(install.layout && install.help && map.layout && map.help
               && playApi.layout && playApi.help,
           "approved layout and description rows resolve");
    if (!install.layout || !install.help || !map.layout || !map.help
        || !playApi.layout || !playApi.help) {
        return;
    }

    PopupFixture fixture(labels);
    expect(fixture.originalMinimumWidth == 0,
           "Qt fixture starts without an explicit popup minimum width");
    OneLocaleEnvelope cache;
    expect(cache.measureOnce(fixture.top) && !cache.widestKey.empty(),
           "401-row envelope measures once for current locale");
    std::cout << "CATALOG locale=" << labels.name
              << " roots=" << native_help_popup_metadata::kRowCount
              << " width=" << cache.width
              << " widest=" << cache.widestKey << '\n';

    const Snapshot installFirst = showContent(
        fixture, cache, install, labels.locale, labels.name, false);
    const Snapshot mapFirst = showContent(
        fixture, cache, map, labels.locale, labels.name, false);
    const Snapshot playState = showContent(
        fixture, cache, playApi, labels.locale, labels.name, true);
    const Snapshot mapAgain = showContent(
        fixture, cache, map, labels.locale, labels.name, false);
    const Snapshot installAgain = showContent(
        fixture, cache, install, labels.locale, labels.name, false);
    expect(sameNaturalFlowHeight(mapFirst, mapAgain),
           "map wrapping and natural row heights stay stable");
    expect(sameNaturalFlowHeight(installFirst, installAgain),
           "installPlugin wrapping and natural row heights stay stable");
    std::cout << "WIDTH-OBS locale=" << labels.name
              << " install-before=" << installFirst.popupWidth
              << " install-after=" << installAgain.popupWidth << '\n';
    expect(cache.calls == 1,
           "content changes reuse the one cached locale envelope");
    expect(playState.popupWidth < cache.width
               + fixture.top->contentsMargins().left()
               + fixture.top->contentsMargins().right(),
           "play popup narrows below the shared catalog cap");
    testShortWidthAfterLongRows(labels, cache);
}
void testExactCallerGate()
{
    using native_help_popup_layout::abi::isExactActivationCaller;
    const auto expected = native_help_popup_layout::abi::kActivateReturnOffset;
    expect(isExactActivationCaller(expected, expected),
           "approved activation return is admitted");
    expect(!isExactActivationCaller(expected + 4, expected),
           "neighboring caller is rejected");
    expect(!isExactActivationCaller(expected, 0),
           "uninitialized caller gate is closed");
}

}  // namespace

int main(int argc, char **argv)
{
    QApplication application(argc, argv);
    expect(native_help_popup_metadata::kRowCount == 401,
           "generated table contains exactly 401 root APIs");
    testExactCallerGate();
    (void)testUnknownLayoutRemainsUntouched();

    runLocale({"zh-Hans", QStringLiteral("函数："), QStringLiteral("参数："),
               QStringLiteral("返回值："), QStringLiteral("说明："), Locale::Hans});
    runLocale({"zh-Hant", QStringLiteral("函式："), QStringLiteral("引數："),
               QStringLiteral("傳回值："), QStringLiteral("說明："), Locale::Hant});
    runLocale({"ja_JP", QStringLiteral("関数："), QStringLiteral("引数："),
               QStringLiteral("戻り値："), QStringLiteral("説明："), Locale::Japanese});
    testPaletteEnumRendering({"zh-Hans", QStringLiteral("函数："),
                              QStringLiteral("参数："), QStringLiteral("返回值："),
                              QStringLiteral("说明："), Locale::Hans});
    testPaletteEnumRendering({"zh-Hant", QStringLiteral("函式："),
                              QStringLiteral("引數："), QStringLiteral("傳回值："),
                              QStringLiteral("說明："), Locale::Hant});
    testPaletteEnumRendering({"ja_JP", QStringLiteral("関数："),
                              QStringLiteral("引数："), QStringLiteral("戻り値："),
                              QStringLiteral("説明："), Locale::Japanese});

    std::cout << "summary failures=" << failures << '\n';
    return failures == 0 ? 0 : 1;
}
