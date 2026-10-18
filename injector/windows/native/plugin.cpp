/*
 * [INPUT]: Qt6.9.2 QGenericPlugin协议、QPA显式language specification和runtime安装接口。
 * [OUTPUT]: cavalryi18n native插件实例与同进程只读diagnostics；不安装通用翻译器。
 * [POS]: Windows2.8窄运行时入口，复用既有QPA的版本/hash/marker启动闭包。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
#include "runtime.h"
#include <QtGui/QGenericPlugin>
#include <QtCore/QCoreApplication>
class NativeRuntime final:public QObject {
    Q_OBJECT
public:
    explicit NativeRuntime(QObject *parent):QObject(parent){}
    Q_INVOKABLE QJsonObject diagnostics() const{return nativeWindowsRuntimeDiagnostics();}
};
class CavalryI18nNativePlugin final:public QGenericPlugin {
    Q_OBJECT
    Q_PLUGIN_METADATA(IID "org.qt-project.Qt.QGenericPluginFactoryInterface" FILE "../cavalryi18n.json")
public:
    QObject *create(const QString &name,const QString &specification) override {
        if(name.compare(QStringLiteral("cavalryi18n"),Qt::CaseInsensitive)!=0)return nullptr;
        if(specification!=QStringLiteral("zh-Hans") && specification!=QStringLiteral("zh-Hant") && specification!=QStringLiteral("ja_JP"))return nullptr;
        QString error;
        if(!installNativeWindowsRuntime(specification,&error))return nullptr;
        return new NativeRuntime(QCoreApplication::instance());
    }
};
#include "plugin.moc"
