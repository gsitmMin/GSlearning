package com.gsitm.learning.security;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    @Query("select a from UserAccount a join fetch a.employee e where e.email = :email")
    Optional<UserAccount> findByEmail(String email);
}
