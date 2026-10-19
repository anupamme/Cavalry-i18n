/**
 * [INPUT]: 依赖QLayout四行结构、401条官方元数据投影与当前QLabel样式。
 * [OUTPUT]: 提供四行结构识别、统一目录上限测量与包装行同步策略。
 * [POS]: 纯Qt布局策略；先同步可见参数包装行，再透传一次宿主root激活。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#pragma once

#include <QtCore/QMargins>
#include <QtCore/QString>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QLabel>
#include <QtWidgets/QLayout>
#include <QtWidgets/QLayoutItem>
#include <QtWidgets/QSpacerItem>
#include <QtWidgets/QVBoxLayout>
#include <QtWidgets/QWidget>

#include <algorithm>
#include <cstddef>
#include <string_view>

namespace native_help_popup_layout {
namespace detail {

inline bool isLabelAt(QHBoxLayout *row, int index)
{
    if (!row || index < 0 || index >= row->count()) return false;
    QLayoutItem *item = row->itemAt(index);
    return item && qobject_cast<QLabel *>(item->widget());
}

inline bool isSpacerAt(QHBoxLayout *row, int index)
{
    if (!row || index < 0 || index >= row->count()) return false;
    QLayoutItem *item = row->itemAt(index);
    return item && item->spacerItem();
}

inline bool hasTwoLabelsAndTrailingSpacers(QHBoxLayout *row)
{
    if (!isLabelAt(row, 0) || !isLabelAt(row, 1)) return false;
    for (int index = 2; index < row->count(); ++index) {
        if (!isSpacerAt(row, index)) return false;
    }
    return true;
}

inline QHBoxLayout *layoutAt(QLayout *layout, int index)
{
    if (!layout || index < 0 || index >= layout->count()) return nullptr;
    QLayoutItem *item = layout->itemAt(index);
    return item ? qobject_cast<QHBoxLayout *>(item->layout()) : nullptr;
}

inline QHBoxLayout *wrappedRowAt(QVBoxLayout *top, int index)
{
    if (!top || index < 0 || index >= top->count()) return nullptr;
    QLayoutItem *item = top->itemAt(index);
    QWidget *container = item ? item->widget() : nullptr;
    return container ? qobject_cast<QHBoxLayout *>(container->layout()) : nullptr;
}

inline bool validFunctionRow(QHBoxLayout *row)
{
    if (!isLabelAt(row, 0) || !isSpacerAt(row, 1) || !isLabelAt(row, 2)) {
        return false;
    }
    for (int index = 3; index < row->count(); ++index) {
        if (!isSpacerAt(row, index)) return false;
    }
    return true;
}

inline bool validInfoRow(QHBoxLayout *row)
{
    return hasTwoLabelsAndTrailingSpacers(row);
}

inline bool validDescriptionRow(QHBoxLayout *row)
{
    return row && row->count() == 3 && isLabelAt(row, 0)
        && isLabelAt(row, 1) && isSpacerAt(row, 2);
}

inline bool isExplicitlyHidden(QLayoutItem *item)
{
    if (!item) return true;
    if (QWidget *widget = item->widget()) return widget->isHidden();
    return item->isEmpty();
}

inline QVBoxLayout *knownFourRowLayout(QLayout *topLevel)
{
    auto *top = qobject_cast<QVBoxLayout *>(topLevel);
    if (!top || top->count() != 4) return nullptr;
    if (!validFunctionRow(layoutAt(top, 0))
        || !validInfoRow(wrappedRowAt(top, 1))
        || !validInfoRow(wrappedRowAt(top, 2))
        || !validDescriptionRow(layoutAt(top, 3))) {
        return nullptr;
    }
    return top;
}

inline QLabel *bodyAt(QVBoxLayout *top)
{
    QHBoxLayout *row = layoutAt(top, 3);
    QLayoutItem *item = row ? row->itemAt(1) : nullptr;
    return item ? qobject_cast<QLabel *>(item->widget()) : nullptr;
}

inline bool bodyMaximum(QHBoxLayout *row, QLabel *body,
                        int rowEnvelopeWidth, int *outWidth)
{
    if (!row || !body || !outWidth || rowEnvelopeWidth <= 0) return false;
    const QMargins margins = row->contentsMargins();
    const int spacing = row->spacing();
    QLayoutItem *titleItem = row->itemAt(0);
    auto *title = titleItem
        ? qobject_cast<QLabel *>(titleItem->widget()) : nullptr;
    if (!title || spacing < 0) return false;
    const int width = rowEnvelopeWidth - margins.left() - margins.right()
        - title->sizeHint().width() - spacing;
    if (width <= 0 || width < body->minimumWidth()) return false;
    *outWidth = width;
    return true;
}

inline bool naturalLabelWidth(QLabel *label, int *outWidth)
{
    if (!label || !outWidth) return false;
    const QSize originalMaximum = label->maximumSize();
    const bool originalWrap = label->wordWrap();
    label->setMaximumSize(QWIDGETSIZE_MAX, QWIDGETSIZE_MAX);
    label->setWordWrap(false);
    const int width = label->sizeHint().width();
    label->setWordWrap(originalWrap);
    label->setMaximumSize(originalMaximum);
    if (width < 0) return false;
    *outWidth = width;
    return true;
}

inline QString text(std::string_view value)
{
    return QString::fromUtf8(value.data(), static_cast<qsizetype>(value.size()));
}

class LabelProbe final {
public:
    explicit LabelProbe(const QLabel &original)
        : label_(original.parentWidget())
    {
        label_.setAttribute(Qt::WA_DontShowOnScreen, true);
        label_.setStyleSheet(original.styleSheet());
        label_.setFont(original.font());
        label_.setTextFormat(original.textFormat());
        label_.setMargin(original.margin());
        label_.setIndent(original.indent());
        label_.setContentsMargins(original.contentsMargins());
        label_.setAlignment(original.alignment());
        label_.setWordWrap(false);
    }

    int width(std::string_view value)
    {
        label_.setText(text(value));
        return label_.sizeHint().width();
    }

private:
    QLabel label_;
};

inline QLabel *labelAt(QHBoxLayout *row, int index)
{
    return qobject_cast<QLabel *>(row->itemAt(index)->widget());
}

inline int rowOverhead(QHBoxLayout *row)
{
    const QMargins margins = row->contentsMargins();
    int width = margins.left() + margins.right();
    for (int index = 0; index < row->count(); ++index) {
        if (QSpacerItem *spacer = row->itemAt(index)->spacerItem()) {
            width += spacer->sizeHint().width();
        }
    }
    return width + std::max(0, row->spacing()) * (row->count() - 1);
}

}  // namespace detail

inline QLabel *descriptionLabel(QLayout *topLevel)
{
    auto *top = detail::knownFourRowLayout(topLevel);
    return top ? detail::bodyAt(top) : nullptr;
}

template <typename Row>
inline int measureCatalogEnvelope(QLayout *layout, const Row *rows,
                                  std::size_t count,
                                  std::string_view *widestKey = nullptr)
{
    auto *top = detail::knownFourRowLayout(layout);
    if (!top || !rows || count == 0) return 0;
    auto *function = detail::layoutAt(top, 0);
    auto *arguments = detail::wrappedRowAt(top, 1);
    auto *returns = detail::wrappedRowAt(top, 2);
    detail::LabelProbe kind(*detail::labelAt(function, 0));
    detail::LabelProbe name(*detail::labelAt(function, 2));
    detail::LabelProbe args(*detail::labelAt(arguments, 1));
    detail::LabelProbe result(*detail::labelAt(returns, 1));
    const int functionExtra = detail::rowOverhead(function);
    const int argumentsExtra = detail::rowOverhead(arguments)
        + detail::labelAt(arguments, 0)->sizeHint().width();
    const int returnsExtra = detail::rowOverhead(returns)
        + detail::labelAt(returns, 0)->sizeHint().width();
    int maximum = 0;
    for (std::size_t index = 0; index < count; ++index) {
        const Row &row = rows[index];
        int width = functionExtra + kind.width(row.kind)
            + name.width(row.runtimeName);
        if (!row.argumentsText.empty()) {
            width = std::max(width,
                argumentsExtra + args.width(row.argumentsText));
        }
        if (!row.returnsText.empty()) {
            width = std::max(width,
                returnsExtra + result.width(row.returnsText));
        }
        if (width > maximum) {
            maximum = width;
            if (widestKey) *widestKey = row.key;
        }
    }
    return maximum;
}

inline bool applyUniformEnvelope(QLayout *topLevel, QLabel *description,
                                 int rowEnvelopeWidth)
{
    auto *top = detail::knownFourRowLayout(topLevel);
    QWidget *popup = top ? top->parentWidget() : nullptr;
    if (!top || !popup || !description || description->isHidden()
        || detail::bodyAt(top) != description) {
        return false;
    }
    QHBoxLayout *row = detail::layoutAt(top, 3);
    int bodyWidth = 0;
    if (!detail::bodyMaximum(row, description, rowEnvelopeWidth, &bodyWidth)) {
        return false;
    }
    const QMargins rootMargins = top->contentsMargins();
    const int popupWidth = rowEnvelopeWidth
        + rootMargins.left() + rootMargins.right();
    if (popupWidth <= 0) return false;

    QLayoutItem *titleItem = row->itemAt(0);
    auto *title = titleItem
        ? qobject_cast<QLabel *>(titleItem->widget()) : nullptr;
    int naturalWidth = 0;
    if (!title || !detail::naturalLabelWidth(description, &naturalWidth)) {
        return false;
    }
    const bool wraps = naturalWidth > bodyWidth;

    // -- 上限只约束超宽正文；字体、padding和行距全部由宿主保留。 --------
    if (description->wordWrap() != wraps) description->setWordWrap(wraps);
    if (description->maximumWidth() != bodyWidth) {
        description->setMaximumWidth(bodyWidth);
    }
    row->setAlignment(title, Qt::AlignTop);
    row->setAlignment(description, Qt::AlignTop);
    if (row->stretch(1) != (wraps ? 1 : 0)) {
        row->setStretch(1, wraps ? 1 : 0);
    }
    if (row->stretch(2) != (wraps ? 0 : 1)) {
        row->setStretch(2, wraps ? 0 : 1);
    }
    if (popup->maximumWidth() != popupWidth) {
        popup->setMaximumWidth(popupWidth);
    }

    // -- 参数与返回包装控件各自持有布局，先同步当前可见行的sizeHint。 --
    const int infoRows[] = {1, 2};
    for (const int index : infoRows) {
        QLayoutItem *item = top->itemAt(index);
        if (detail::isExplicitlyHidden(item)) continue;
        QWidget *container = item ? item->widget() : nullptr;
        QLayout *inner = container ? container->layout() : nullptr;
        if (inner) inner->activate();
    }
    return true;
}

}  // namespace native_help_popup_layout
