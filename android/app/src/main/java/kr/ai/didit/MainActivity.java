package kr.ai.didit;

import android.graphics.Color;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 커스텀 하단 내비게이션 바 플러그인 등록 (super.onCreate 이전에 호출해야 함)
        registerPlugin(NavigationBarPlugin.class);
        super.onCreate(savedInstanceState);

        // WebView가 비불투명 레이어로 합성되면 Chromium이 LCD 서브픽셀 텍스트 AA 대신
        // grayscale AA를 써서 작은 글자가 물러 보인다(웹은 불투명이라 선명). WebView 배경을
        // 불투명 흰색으로 강제해 서브픽셀 AA를 복구한다. (화면별 배경은 각 페이지가 덮어 그림)
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(Color.WHITE);
        }
    }
}
