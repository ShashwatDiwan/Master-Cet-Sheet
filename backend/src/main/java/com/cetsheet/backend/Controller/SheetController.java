package com.cetsheet.backend.Controller;

import com.cetsheet.backend.Security.Service.AuthenticatedUserService;
import com.cetsheet.backend.Services.SheetService;
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
    private AuthenticatedUserService authenticatedUserService;

    @GetMapping("")
    public List<SheetDTO> getAllSheets(){
        // pass the current user id so that each sheet's chapter completion
        // flags can be computed per-user. if user is not authenticated,
        // the service will simply ignore the id and return global data.
        return sheetService.getAllSheets(authenticatedUserService.currentUserIdOrNull());
    }

    @GetMapping("/byId/{id}")
    public SheetDTO getSheetById(@PathVariable("id") int sheetId){
        return sheetService.getSheetById(sheetId, authenticatedUserService.currentUserIdOrNull());
    }

    @GetMapping("/byName/{name}")
    public SheetDTO getSheetByName(@PathVariable("name") String sheetName){
        return sheetService.getSheetByName(sheetName, authenticatedUserService.currentUserIdOrNull());
    }
}
