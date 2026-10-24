package com.barbeariadojota.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Aviso de agendamento novo: mostra uma NOTIFICACAO na barra do Android
 * (com som/vibracao do sistema) quando um cliente agenda no app.
 * O Android 13+ exige pedir a permissao de notificacao uma vez.
 */
@CapacitorPlugin(name = "Aviso")
public class AvisoPlugin extends Plugin {

    private static final String CANAL = "bjota-agendamentos";
    private static final int PEDIDO_NOTIFICACAO = 17011;

    @Override
    public void load() {
        super.load();
        criarCanal();
        // pede a permissao de notificacao uma vez (Android 13+)
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(
                        getActivity(),
                        new String[]{ Manifest.permission.POST_NOTIFICATIONS },
                        PEDIDO_NOTIFICACAO);
            }
        }
    }

    private void criarCanal() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CANAL) != null) return;
        NotificationChannel canal = new NotificationChannel(
                CANAL, "Agendamentos", NotificationManager.IMPORTANCE_HIGH);
        canal.setDescription("Aviso quando um cliente agenda na barbearia");
        canal.enableVibration(true);
        nm.createNotificationChannel(canal);
    }

    @PluginMethod
    public void notificar(PluginCall call) {
        String titulo = call.getString("titulo");
        String texto = call.getString("texto");
        if (titulo == null || titulo.isEmpty()) titulo = "Barbearia do Jota";
        if (texto == null) texto = "";

        Context ctx = getContext();
        criarCanal();

        // Android 13+: sem permissao, tenta pedir e sai (o toast do app cobre)
        if (Build.VERSION.SDK_INT >= 33 &&
                ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS)
                        != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{ Manifest.permission.POST_NOTIFICATIONS },
                    PEDIDO_NOTIFICACAO);
            call.resolve();
            return;
        }

        try {
            Intent abrir = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
            PendingIntent pAcao = PendingIntent.getActivity(
                    ctx, 0, abrir,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            NotificationCompat.Builder n = new NotificationCompat.Builder(ctx, CANAL)
                    .setSmallIcon(android.R.drawable.ic_dialog_info)
                    .setContentTitle(titulo)
                    .setContentText(texto)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(texto))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                    .setAutoCancel(true)
                    .setContentIntent(pAcao);

            NotificationManagerCompat.from(ctx)
                    .notify((int) (System.currentTimeMillis() % 100000), n.build());
            call.resolve();
        } catch (Exception e) {
            call.reject("nao consegui notificar: " + e.getMessage());
        }
    }

    @PluginMethod
    public void pedirPermissao(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33) {
            ActivityCompat.requestPermissions(
                    getActivity(),
                    new String[]{ Manifest.permission.POST_NOTIFICATIONS },
                    PEDIDO_NOTIFICACAO);
        }
        call.resolve();
    }
}
