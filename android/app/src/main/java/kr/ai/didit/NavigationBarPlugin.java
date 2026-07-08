package kr.ai.didit;

import android.graphics.Color;
import android.os.Build;
import android.view.View;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// 하단 내비게이션 바 색을 런타임에 현재 화면 배경색으로 칠하기 위한 커스텀 플러그인.
// (@capacitor/status-bar는 상단 상태바만 다뤄서, 하단 내비바는 직접 구현한다)
@CapacitorPlugin(name = "NavigationBar")
public class NavigationBarPlugin extends Plugin {

    // setColor({ color: '#RRGGBB', darkButtons: boolean })
    @PluginMethod
    public void setColor(PluginCall call) {
        final String color = call.getString("color");
        final boolean darkButtons = Boolean.TRUE.equals(call.getBoolean("darkButtons", true));
        if (color == null) {
            call.reject("color is required");
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                getActivity().getWindow().setNavigationBarColor(Color.parseColor(color));
                // 밝은 배경이면 어두운 버튼(LIGHT_NAVIGATION_BAR) — API 26+ 에서만 지원
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    View decor = getActivity().getWindow().getDecorView();
                    int flags = decor.getSystemUiVisibility();
                    if (darkButtons) {
                        flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    } else {
                        flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    }
                    decor.setSystemUiVisibility(flags);
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("failed to set navigation bar color: " + e.getMessage());
            }
        });
    }
}
