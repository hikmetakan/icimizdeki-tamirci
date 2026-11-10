<?php
/**
 * İçimizdeki Tamirci — Admin Yönlendirmesi
 * Eski /admin linklerini otomatik olarak /yonetici adresine yönlendirir.
 */
header('X-LiteSpeed-Cache-Control: no-cache, no-store');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Location: yonetici', true, 301);
exit;
