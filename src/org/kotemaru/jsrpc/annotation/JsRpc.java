package org.kotemaru.jsrpc.annotation;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.lang.annotation.ElementType;

import org.kotemaru.apthelper.annotation.ProcessorGenerate;

import org.kotemaru.jsrpc.apt.JavaScriptStubHelper;
import org.kotemaru.jsrpc.*;



/**
{@see CalljavaServlet}クラス用のJavaScriptスタブを生成するアノテーション。
<li>当該クラスと同じパッケージに "クラス名.js" としてスタブを生成する。
<li>今の所、public static のメソッドのみが対象。
@autor kotemaru@kotemaru.org
*/
@Retention(RetentionPolicy.CLASS)
@Target(ElementType.TYPE)
@ProcessorGenerate(template="JavaScriptStub.vm",suffix=".js",
		isResource=true,helper=JavaScriptStubHelper.class)

public @interface JsRpc {
}
