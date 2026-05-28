import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { BadRequestError } from '../../lib/errors';

export class AuthController {
  /**
   * Log in user and return access token + set HTTP-only cookie
   */
  public async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      
      // Set secure HTTP-only refresh token cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in ms
      });

      return res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          user: result.user
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token using cookie or body token
   */
  public async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        throw new BadRequestError('Refresh token is missing from requests', 'MISSING_REFRESH_TOKEN');
      }

      const result = await authService.refresh(refreshToken);

      // Rotate secure HTTP-only refresh token cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log out user and revoke refresh token
   */
  public async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      return res.status(200).json({
        success: true,
        data: {
          message: 'Successfully logged out and session revoked'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new clinic and its clinic admin user
   */
  public async registerClinic(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.registerClinic(req.body);
      return res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
