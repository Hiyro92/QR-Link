# User Authentication Microservice API Documentation

## Base URL

`/api`

## Authentication

All protected endpoints require a JSON Web Token (JWT) passed in the `Authorization` header as `Bearer <token>`.

Example Header:
`Authorization: Bearer eyJhbGci...`

Upon successful login, the `/api/auth/login` endpoint returns `token` and `refreshToken`. The `token` should be used for subsequent requests. The `refreshToken` can be used to obtain a new `token` when the current one expires, via the `/api/auth/refresh-token` endpoint.

## Endpoints

### Authentication

- **POST /api/auth/register**

  - **Description:** Registers a new company and its initial admin user.
  - **Request Body:**
    ```json
    {
      "companyName": "string",
      "companyAddress": "string", // optional
      "companyPhone": "string", // optional
      "email": "string", // Admin user's email
      "password": "string", // Admin user's password (min 8 characters)
      "firstName": "string", // Admin user's first name
      "lastName": "string" // Admin user's last name
    }
    ```
  - **Responses:**
    - `201 Created`:
      ```json
      {
        "message": "Company registered successfully. Please verify your email.",
        "companyId": "uuid"
      }
      ```
    - `400 Bad Request`: If email is already registered or validation fails.
    - `500 Internal Server Error`: For other errors.

- **GET /api/auth/verify-email/:token**

  - **Description:** Verifies the admin user's email address using the token sent via email.
  - **URL Parameters:**
    - `token`: The email verification token (string).
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "message": "Email verified successfully"
      }
      ```
    - `400 Bad Request`: If the token is invalid or already used.
    - `500 Internal Server Error`: For other errors.

- **POST /api/auth/login**

  - **Description:** Logs in a user and returns JWT and refresh token.
  - **Request Body:**
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "message": "Login successful",
        "token": "string", // JWT for API access
        "refreshToken": "string", // Token to get new JWT
        "user": {
          "id": "uuid",
          "email": "string",
          "firstName": "string",
          "lastName": "string",
          "company": {
            "id": "uuid",
            "name": "string"
          }
        }
      }
      ```
    - `401 Unauthorized`: Invalid credentials, email not verified, inactive account, or account locked.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

- **POST /api/auth/refresh-token**

  - **Description:** Refreshes an expired JWT using a refresh token.
  - **Request Body:**
    ```json
    {
      "refreshToken": "string"
    }
    ```
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "token": "string", // New JWT
        "refreshToken": "string" // New refresh token
      }
      ```
    - `400 Bad Request`: If refresh token is missing.
    - `401 Unauthorized`: Invalid or expired refresh token, or inactive account.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

- **POST /api/auth/forgot-password**

  - **Description:** Initiates the password reset process by sending a reset email.
  - **Request Body:**
    ```json
    {
      "email": "string"
    }
    ```
  - **Responses:**
    - `200 OK`: Always returns this status to prevent revealing valid emails.
      ```json
      {
        "message": "If that email exists in our system, we have sent a password reset link"
      }
      ```
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

- **POST /api/auth/reset-password**

  - **Description:** Resets the user's password using a reset token.
  - **Request Body:**
    ```json
    {
      "token": "string", // The password reset token from the email
      "password": "string" // The new password (min 8 characters)
    }
    ```
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "message": "Password has been reset successfully"
      }
      ```
    - `400 Bad Request`: If the token is invalid or expired.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

- **POST /api/auth/logout**
  - **Description:** Logs out the currently authenticated user (client-side action to discard token).
  - **Requires Authentication:** Yes
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "message": "Logged out successfully"
      }
      ```
    - `401 Unauthorized`: If authentication fails.
    - `500 Internal Server Error`: For other errors.

### User Management

- **GET /api/users/me**

  - **Description:** Get the profile of the currently authenticated user.
  - **Requires Authentication:** Yes
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "user": {
          "id": "uuid",
          "username": "string",
          "email": "string",
          "company_id": "uuid",
          "role_id": "uuid",
          "first_name": "string", // nullable
          "last_name": "string", // nullable
          "phone": "string", // nullable
          "profile_image": "string", // nullable
          "timezone": "string",
          "language": "string",
          "created_at": "datetime",
          "updated_at": "datetime",
          "last_login": "datetime", // nullable
          "is_active": "boolean",
          "is_email_verified": "boolean",
          "failed_login_attempts": "integer",
          "locked_until": "datetime", // nullable
          "mfa_enabled": "boolean",
          "Role": {
            // Included Role details
            "id": "uuid",
            "name": "string",
            "description": "string" // nullable
          },
          "Company": {
            // Included Company details
            "id": "uuid",
            "name": "string",
            "is_active": "boolean"
          }
        }
      }
      ```
    - `401 Unauthorized`: If authentication fails.
    - `404 Not Found`: If user is not found (should not happen with valid token).
    - `500 Internal Server Error`: For other errors.

- **PUT /api/users/me**

  - **Description:** Update the profile of the currently authenticated user.
  - **Requires Authentication:** Yes
  - **Request Body:** (Any combination of the following fields)
    ```json
    {
      "first_name": "string", // optional
      "last_name": "string", // optional
      "phone": "string", // optional
      "timezone": "string", // optional
      "language": "string" // optional
    }
    ```
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "message": "Profile updated successfully",
        "user": {
          // Updated user object (excluding sensitive fields)
        }
      }
      ```
    - `401 Unauthorized`: If authentication fails.
    - `404 Not Found`: If user is not found.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

- **POST /api/users/change-password**

  - **Description:** Change the password for the currently authenticated user.
  - **Requires Authentication:** Yes
  - **Request Body:**
    ```json
    {
      "currentPassword": "string",
      "newPassword": "string" // min 8 characters
    }
    ```
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "message": "Password changed successfully"
      }
      ```
    - `401 Unauthorized`: If authentication fails or current password is incorrect.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

- **GET /api/users/company**

  - **Description:** Get a list of all users within the authenticated user's company.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `view_users`
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "users": [
          {
            "id": "uuid",
            "username": "string",
            "email": "string",
            "company_id": "uuid",
            "role_id": "uuid",
            "first_name": "string", // nullable
            "last_name": "string", // nullable
            "phone": "string", // nullable
            "is_active": "boolean",
            "is_email_verified": "boolean",
            "created_at": "datetime",
            "updated_at": "datetime",
            "Role": {
              "id": "uuid",
              "name": "string"
            }
            // ... other relevant user fields excluding sensitive ones
          }
          // ...
        ]
      }
      ```
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the `view_users` permission.
    - `500 Internal Server Error`: For other errors.

- **GET /api/users/:userId**

  - **Description:** Get details for a specific user within the authenticated user's company.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `view_users`
  - **URL Parameters:**
    - `userId`: The UUID of the user.
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "user": {
          "id": "uuid",
          "username": "string",
          "email": "string"
          // ... other user fields as in GET /api/users/company
        }
      }
      ```
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the `view_users` permission.
    - `404 Not Found`: If the user ID is not found within the company.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

- **POST /api/users/invite**

  - **Description:** Invite a new user to the company. An email will be sent to the user to set their password.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `create_users`
  - **Request Body:**
    ```json
    {
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "roleId": "uuid", // The UUID of the role the invited user will have
      "phone": "string" // optional
    }
    ```
  - **Responses:**
    - `201 Created`:
      ```json
      {
        "message": "User invited successfully. An invitation email has been sent.",
        "invitationId": "uuid"
      }
      ```
    - `400 Bad Request`: If email is already registered or role ID is invalid/not in company.
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the `create_users` permission.
    - `404 Not Found`: If the specified `roleId` does not exist for the company.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors (e.g., email sending failure, database error).

- **PUT /api/users/:userId**

  - **Description:** Update a user's details within the company.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `update_users`
  - **URL Parameters:**
    - `userId`: The UUID of the user to update.
  - **Request Body:** (Any combination of the following fields)
    ```json
    {
      "firstName": "string", // optional
      "lastName": "string", // optional
      "roleId": "uuid", // optional
      "isActive": "boolean", // optional
      "phone": "string" // optional
    }
    ```
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "message": "User updated successfully",
        "user": {
          // Updated user object (excluding sensitive fields)
        }
      }
      ```
    - `400 Bad Request`: If `roleId` is invalid or not in company.
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the `update_users` permission.
    - `404 Not Found`: If the user ID or role ID is not found within the company.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

- **DELETE /api/users/:userId**
  - **Description:** Deactivate (soft delete) a user within the company.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `delete_users`
  - **URL Parameters:**
    - `userId`: The UUID of the user to deactivate.
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "message": "User deactivated successfully"
      }
      ```
    - `400 Bad Request`: If attempting to delete the currently authenticated user.
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the `delete_users` permission.
    - `404 Not Found`: If the user ID is not found within the company.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

### Company Management

- **GET /api/companies**

  - **Description:** Get the profile details of the authenticated user's company.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `view_company_profile` (example permission)
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "company": {
          "id": "uuid",
          "name": "string",
          "address": "string", // nullable
          "phone": "string", // nullable
          "logo": "string", // nullable
          "is_active": "boolean",
          "subscription_plan": "string", // nullable
          "subscription_expiry_date": "datetime", // nullable
          "settings": "json_object", // nullable
          "domain": "string", // nullable
          "created_at": "datetime"
        }
      }
      ```
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the required permission.
    - `404 Not Found`: If the company is not found (should not happen).
    - `500 Internal Server Error`: For other errors.

- **PUT /api/companies**

  - **Description:** Update the profile details of the authenticated user's company.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `update_company_profile` (example permission)
  - **Request Body:** (Any combination of the following fields)
    ```json
    {
      "name": "string", // optional
      "address": "string", // optional
      "phone": "string", // optional
      "logo": "string" // optional (URL/Path)
    }
    ```
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "message": "Company profile updated successfully",
        "company": {
          "id": "uuid",
          "name": "string",
          "address": "string",
          "phone": "string",
          "logo": "string"
          // Note: Full company object is not returned, only updated fields confirmation
        }
      }
      ```
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the required permission.
    - `404 Not Found`: If the company is not found.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

- **PUT /api/companies/settings**
  - **Description:** Update the settings for the authenticated user's company.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `manage_company_settings` (example permission)
  - **Request Body:**
    ```json
    {
      "settings": {
        // This should be a JSON object containing settings
        "key1": "value1",
        "key2": 123,
        "key3": true
        // ...
      }
    }
    ```
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "message": "Company settings updated successfully",
        "settings": {
          // The updated settings object
        }
      }
      ```
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the required permission.
    - `404 Not Found`: If the company is not found.
    - `422 Unprocessable Entity`: If validation fails (e.g., if `settings` is not an object).
    - `500 Internal Server Error`: For other errors.

### Role and Permission Management

- **GET /api/roles/permissions**

  - **Description:** Get a list of all available system-wide permissions.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `view_permissions` (example permission)
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "permissions": [
          {
            "id": "uuid",
            "name": "string",
            "description": "string", // nullable
            "resource": "string"
          }
          // ...
        ]
      }
      ```
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the required permission.
    - `500 Internal Server Error`: For other errors.

- **GET /api/roles**

  - **Description:** Get a list of all roles defined for the authenticated user's company. Includes associated permissions for each role.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `view_roles` (example permission)
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "roles": [
          {
            "id": "uuid",
            "name": "string",
            "description": "string", // nullable
            "company_id": "uuid", // nullable for system roles
            "created_at": "datetime",
            "Permissions": [
              // Array of permissions associated with the role
              {
                "id": "uuid",
                "name": "string",
                "description": "string",
                "resource": "string"
              }
              // ...
            ]
          }
          // ...
        ]
      }
      ```
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the required permission.
    - `500 Internal Server Error`: For other errors.

- **GET /api/roles/:roleId**

  - **Description:** Get details for a specific role within the authenticated user's company. Includes associated permissions.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `view_roles`
  - **URL Parameters:**
    - `roleId`: The UUID of the role.
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "role": {
          "id": "uuid",
          "name": "string",
          "description": "string", // nullable
          "company_id": "uuid", // nullable
          "created_at": "datetime",
          "Permissions": [
            // Array of permissions associated with the role
            {
              "id": "uuid",
              "name": "string",
              "description": "string",
              "resource": "string"
            }
            // ...
          ]
        }
      }
      ```
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the `view_roles` permission.
    - `404 Not Found`: If the role ID is not found within the company.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

- **POST /api/roles**

  - **Description:** Create a new role for the company.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `create_roles` (example permission)
  - **Request Body:**
    ```json
    {
      "name": "string",
      "description": "string", // optional
      "permissionIds": ["uuid", "uuid"] // optional array of permission UUIDs
    }
    ```
  - **Responses:**
    - `201 Created`:
      ```json
      {
        "message": "Role created successfully",
        "role": {
          "id": "uuid",
          "name": "string",
          "description": "string" // nullable
        }
      }
      ```
    - `400 Bad Request`: If role name already exists for the company.
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the `create_roles` permission.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

- **PUT /api/roles/:roleId**

  - **Description:** Update a role's details and permissions for the company.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `update_roles` (example permission)
  - **URL Parameters:**
    - `roleId`: The UUID of the role to update.
  - **Request Body:** (Any combination of the following fields)
    ```json
    {
      "name": "string", // optional
      "description": "string", // optional
      "permissionIds": ["uuid", "uuid"] // optional array of permission UUIDs (replaces all existing permissions for this role)
    }
    ```
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "message": "Role updated successfully",
        "role": {
          "id": "uuid",
          "name": "string",
          "description": "string",
          "permissions": ["uuid", "uuid"] // Array of permission IDs
        }
      }
      ```
    - `400 Bad Request`: If new role name already exists (excluding the current role) or if attempting to update a protected system role.
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the `update_roles` permission.
    - `404 Not Found`: If the role ID is not found within the company.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

- **DELETE /api/roles/:roleId**
  - **Description:** Delete a role from the company.
  - **Requires Authentication:** Yes
  - **Requires Permission:** `delete_roles` (example permission)
  - **URL Parameters:**
    - `roleId`: The UUID of the role to delete.
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "message": "Role deleted successfully"
      }
      ```
    - `400 Bad Request`: If the role is currently assigned to any users.
    - `401 Unauthorized`: If authentication fails.
    - `403 Forbidden`: If the user does not have the `delete_roles` permission or if attempting to delete a protected system role.
    - `404 Not Found`: If the role ID is not found within the company.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

### Invitation Management

- _(Note: Invitation endpoints are primarily for the invited user to accept the invitation.)_

- **GET /api/invitations/:token**

  - **Description:** Validates an invitation token and returns invitation details if valid.
  - **Requires Authentication:** No (Used before user is registered)
  - **URL Parameters:**
    - `token`: The invitation token (string).
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "invitation": {
          "id": "uuid",
          "email": "string",
          "company_id": "uuid",
          "role_id": "uuid",
          "status": "string", // e.g., "pending"
          "expires_at": "datetime",
          "Company": {
            "id": "uuid",
            "name": "string"
          },
          "Role": {
            "id": "uuid",
            "name": "string"
          }
        }
      }
      ```
    - `400 Bad Request`: If the token is invalid, expired, or already accepted.
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

- **POST /api/invitations/:token/accept**
  - **Description:** Accepts an invitation and allows the user to set their password and complete registration.
  - **Requires Authentication:** No (Used before user is registered)
  - **URL Parameters:**
    - `token`: The invitation token (string).
  - **Request Body:**
    ```json
    {
      "password": "string", // The user's chosen password (min 8 characters)
      "firstName": "string", // User's first name (can be pre-filled from invite but confirmed/edited here)
      "lastName": "string" // User's last name
      // Optionally allow updating other fields like username, phone, etc.
    }
    ```
  - **Responses:**
    - `200 OK`:
      ```json
      {
        "message": "Invitation accepted and account created successfully. You can now log in.",
        "userId": "uuid"
      }
      ```
    - `400 Bad Request`: If the token is invalid, expired, already accepted, or validation fails (e.g., password too short).
    - `422 Unprocessable Entity`: If validation fails.
    - `500 Internal Server Error`: For other errors.

## Error Responses

- When an error occurs, the API generally returns a JSON object with a `message` field. In development mode, a `stack` field might also be included for debugging.
- Validation errors from `express-validator` will return a `422 Unprocessable Entity` status with an `errors` array:
  ```json
  {
    "errors": [
      {
        "fieldName1": "Validation error message for field1"
      },
      {
        "fieldName2": "Validation error message for field2"
      }
    ]
  }
  ```
