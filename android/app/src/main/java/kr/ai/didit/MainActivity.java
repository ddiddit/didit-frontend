package kr.ai.didit;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 커스텀 하단 내비게이션 바 플러그인 등록 (super.onCreate 이전에 호출해야 함)
        registerPlugin(NavigationBarPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
