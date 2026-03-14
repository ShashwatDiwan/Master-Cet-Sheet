package com.cetsheet.backend.Controller;

import com.cetsheet.backend.Services.SheetService;
import com.cetsheet.backend.Repository.UserRepository;
import com.cetsheet.backend.Security.Model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import com.cetsheet.backend.dto.SheetDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sheets")
public class SheetController {
    @Autowired
    private SheetService sheetService;

    @Autowired
    private UserRepository userRepository;

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return null;
        }
        return userRepository.findByEmail(auth.getName())
                .map(User::getId)
                .orElse(null);
    }

    @GetMapping("")
    public List<SheetDTO> getAllSheets(){
        // pass the current user id so that each sheet's chapter completion
        // flags can be computed per-user. if user is not authenticated,
        // the service will simply ignore the id and return global data.
        return sheetService.getAllSheets(currentUserId());
    }

    @GetMapping("/byId/{id}")
    public SheetDTO getSheetById(@PathVariable("id") int sheetId){
        return sheetService.getSheetById(sheetId, currentUserId());
    }

    @GetMapping("/byName/{name}")
    public SheetDTO getSheetByName(@PathVariable("name") String sheetName){
        return sheetService.getSheetByName(sheetName, currentUserId());
    }
}
