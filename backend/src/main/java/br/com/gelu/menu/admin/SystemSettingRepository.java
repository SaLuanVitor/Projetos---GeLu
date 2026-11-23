package br.com.gelu.menu.admin;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {
  Optional<SystemSetting> findByKey(String key);
}
